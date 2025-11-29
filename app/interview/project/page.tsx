"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, ArrowRight, Star, Loader2, ArrowLeft, Briefcase, Volume2 } from "lucide-react";
import Link from "next/link";

interface Feedback {
    rating: number;
    feedback: string;
    suggestedAnswer: string;
    nextQuestion: string;
}

export default function ProjectInterviewPage() {
    // Setup State
    const [hasStarted, setHasStarted] = useState(false);
    const [projectTitle, setProjectTitle] = useState("");
    const [projectDescription, setProjectDescription] = useState("");

    // Interview State
    const [currentQuestion, setCurrentQuestion] = useState<string>("");
    const [isRecording, setIsRecording] = useState(false);
    const [transcribedText, setTranscribedText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [questionCount, setQuestionCount] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);

    // UI State
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);

    // Speech Refs
    const recognitionRef = useRef<any>(null);
    const synthesisRef = useRef<SpeechSynthesis | null>(null);

    // Initialize Speech APIs
    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-IN'; // Set language to Indian English

                recognition.onresult = (event: any) => {
                    let finalTranscript = "";
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        }
                    }
                    if (finalTranscript) {
                        setTranscribedText(prev => prev + " " + finalTranscript);
                    }
                };

                recognition.onerror = (event: any) => {
                    console.error("Speech recognition error", event.error);
                    setIsRecording(false);
                };

                recognitionRef.current = recognition;
            }

            if (window.speechSynthesis) {
                synthesisRef.current = window.speechSynthesis;
            }
        }
    }, []);

    // Speak Question
    useEffect(() => {
        if (currentQuestion && hasStarted && !feedback) {
            speakText(currentQuestion);
        }
    }, [currentQuestion, hasStarted, feedback]);

    const speakText = (text: string) => {
        if (synthesisRef.current) {
            synthesisRef.current.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);

            const voices = synthesisRef.current.getVoices();
            const preferredVoice = voices.find(voice => voice.name.includes("Google US English") || voice.name.includes("Samantha"));
            if (preferredVoice) utterance.voice = preferredVoice;

            synthesisRef.current.speak(utterance);
        }
    };

    const startInterview = async () => {
        if (!projectTitle.trim() || !projectDescription.trim()) {
            alert("Please fill in your project details.");
            return;
        }

        setHasStarted(true);
        setIsLoading(true);
        try {
            const res = await fetch("/api/interview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [],
                    questionCount: 0,
                    type: "project",
                    projectContext: `Title: ${projectTitle}\nDescription: ${projectDescription}`
                }),
            });
            const data = await res.json();
            if (data.nextQuestion) {
                setCurrentQuestion(data.nextQuestion);
                setMessages([{ role: "assistant", content: data.nextQuestion }]);
                setQuestionCount(1);
            }
        } catch (error) {
            console.error("Failed to start interview", error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleRecording = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
            return;
        }

        if (isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
        } else {
            if (isSpeaking && synthesisRef.current) {
                synthesisRef.current.cancel();
                setIsSpeaking(false);
            }
            setTranscribedText("");
            recognitionRef.current.start();
            setIsRecording(true);
        }
    };

    const handleSubmitAnswer = async () => {
        if (!transcribedText.trim()) return;

        if (isRecording && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
        }

        const userMsg = { role: "user", content: transcribedText };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);

        setIsLoading(true);

        try {
            const res = await fetch("/api/interview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: updatedMessages,
                    userResponse: transcribedText,
                    questionCount: questionCount,
                    type: "project",
                    projectContext: `Title: ${projectTitle}\nDescription: ${projectDescription}`
                }),
            });
            const data = await res.json();
            setFeedback(data);
        } catch (error) {
            console.error("Failed to submit answer", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNextQuestion = () => {
        if (questionCount >= 15) {
            setIsCompleted(true);
            return;
        }

        if (feedback?.nextQuestion) {
            const nextQ = feedback.nextQuestion;
            setCurrentQuestion(nextQ);
            setMessages(prev => [...prev, { role: "assistant", content: nextQ }]);
            setFeedback(null);
            setTranscribedText("");
            setQuestionCount(prev => prev + 1);
        }
    };

    if (!hasStarted) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-[#0e0e0e] p-6 text-white">
                <div className="w-full max-w-2xl rounded-2xl border border-gray-800 bg-[#161616] p-8 shadow-2xl">
                    <div className="mb-8 text-center">
                        <div className="mb-4 inline-flex rounded-full bg-blue-900/20 p-4">
                            <Briefcase className="h-8 w-8 text-blue-500" />
                        </div>
                        <h1 className="mb-2 text-3xl font-bold">Project Interview</h1>
                        <p className="text-gray-400">
                            Deep dive into your project's architecture and technical decisions.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-300">Project Title</label>
                            <input
                                type="text"
                                value={projectTitle}
                                onChange={(e) => setProjectTitle(e.target.value)}
                                placeholder="e.g., E-commerce Microservices App"
                                className="w-full rounded-xl border border-gray-700 bg-[#0e0e0e] px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-300">Project Description & Tech Stack</label>
                            <textarea
                                value={projectDescription}
                                onChange={(e) => setProjectDescription(e.target.value)}
                                placeholder="Briefly describe your project and the technologies used..."
                                className="h-32 w-full resize-none rounded-xl border border-gray-700 bg-[#0e0e0e] px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <button
                            onClick={startInterview}
                            className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white transition-transform hover:scale-[1.02] hover:bg-blue-500 active:scale-[0.98]"
                        >
                            Start Interview
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isCompleted) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-[#0e0e0e] text-white">
                <div className="max-w-md text-center">
                    <div className="mb-6 flex justify-center">
                        <div className="rounded-full bg-blue-900/20 p-6">
                            <Briefcase className="h-12 w-12 text-blue-500" />
                        </div>
                    </div>
                    <h1 className="mb-4 text-3xl font-bold">Interview Completed!</h1>
                    <p className="mb-8 text-gray-400">
                        Great job explaining your project. Review the feedback to improve your storytelling.
                    </p>
                    <Link
                        href="/interview"
                        className="rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                        Return to Interview Hub
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-[#0e0e0e] text-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-800 bg-[#161616] px-6 py-4">
                <Link href="/interview" className="flex items-center gap-2 text-gray-400 hover:text-white">
                    <ArrowLeft className="h-5 w-5" />
                    <span className="hidden sm:inline">Exit</span>
                </Link>
                <div className="flex flex-col items-center">
                    <span className="text-sm font-medium text-blue-500">Project Round</span>
                    <div className="flex gap-1">
                        {Array.from({ length: 15 }).map((_, i) => (
                            <div
                                key={i}
                                className={`h-1 w-3 rounded-full ${i < questionCount ? "bg-blue-500" : "bg-gray-800"
                                    }`}
                            />
                        ))}
                    </div>
                </div>
                <div className="text-sm font-medium text-gray-400">
                    Q{questionCount}/15
                </div>
            </div>

            {/* Content Area */}
            <div className="flex flex-1 flex-col items-center justify-center p-6">
                <div className="w-full max-w-3xl">

                    {/* Question Card */}
                    {!feedback && (
                        <div className="animate-in fade-in zoom-in-95 duration-500">
                            <div className="mb-8 text-center">
                                <span className="mb-4 inline-block rounded-full bg-gray-800 px-4 py-1 text-sm font-medium text-gray-300">
                                    Question {questionCount}
                                </span>
                                <h2 className="text-3xl font-bold leading-tight md:text-4xl">
                                    {currentQuestion}
                                </h2>
                            </div>

                            {/* Interaction Area */}
                            <div className="flex flex-col items-center justify-center gap-8">
                                {isSpeaking ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-blue-500/20">
                                            <Volume2 className="h-10 w-10 animate-pulse text-blue-400" />
                                            <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20"></div>
                                        </div>
                                        <p className="text-blue-400">Speaking question...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-6 w-full">
                                        <button
                                            onClick={toggleRecording}
                                            className={`group relative flex h-32 w-32 items-center justify-center rounded-full transition-all ${isRecording
                                                ? "bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)] scale-110"
                                                : "bg-blue-600 hover:bg-blue-500 hover:scale-105 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                                                }`}
                                        >
                                            {isRecording ? (
                                                <div className="h-12 w-12 rounded bg-white" />
                                            ) : (
                                                <Mic className="h-14 w-14 text-white" />
                                            )}
                                        </button>

                                        <p className="text-lg text-gray-400">
                                            {isRecording
                                                ? "Listening... Click to stop"
                                                : "Click the microphone to record your answer"
                                            }
                                        </p>

                                        {transcribedText && (
                                            <div className="w-full rounded-xl border border-gray-800 bg-[#161616] p-4 text-center">
                                                <p className="text-gray-300">"{transcribedText}"</p>
                                            </div>
                                        )}

                                        {!isRecording && transcribedText && (
                                            <button
                                                onClick={handleSubmitAnswer}
                                                disabled={isLoading}
                                                className="flex items-center gap-2 rounded-full bg-white px-8 py-3 font-bold text-black transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                                            >
                                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit Answer"}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Feedback Card */}
                    {feedback && (
                        <div className="animate-in slide-in-from-bottom-8 duration-500">
                            <div className="rounded-2xl border border-gray-800 bg-[#161616] p-8 shadow-2xl">
                                <div className="mb-6 flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-white">AI Feedback</h3>
                                    <div className="flex items-center gap-2 rounded-full bg-yellow-900/20 px-4 py-2 text-yellow-400">
                                        <Star className="h-5 w-5 fill-current" />
                                        <span className="text-lg font-bold">{feedback.rating}/10</span>
                                    </div>
                                </div>

                                <div className="mb-8 space-y-6">
                                    <div>
                                        <h4 className="mb-2 text-sm font-medium text-gray-400 uppercase tracking-wider">Analysis</h4>
                                        <p className="text-lg leading-relaxed text-gray-200">{feedback.feedback}</p>
                                    </div>

                                    <div className="rounded-xl bg-green-900/10 p-6 border border-green-900/30">
                                        <h4 className="mb-3 text-sm font-medium text-green-400 uppercase tracking-wider">Suggested Answer</h4>
                                        <p className="text-base leading-relaxed text-green-100/90 italic">"{feedback.suggestedAnswer}"</p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleNextQuestion}
                                    className="flex w-full items-center justify-center gap-3 rounded-xl bg-blue-600 py-4 text-lg font-bold text-white transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-900/20"
                                >
                                    Next Question <ArrowRight className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && !feedback && (
                        <div className="mt-8 flex justify-center">
                            <div className="flex items-center gap-3 rounded-full bg-[#1e1e1e] px-6 py-3 text-gray-400">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Analyzing your response...</span>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
