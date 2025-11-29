"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Send, ArrowRight, Star, Loader2, ArrowLeft, Briefcase, User, Code2, BrainCircuit, Trophy } from "lucide-react";
import Link from "next/link";

interface Feedback {
    rating: number;
    feedback: string;
    suggestedAnswer: string;
    nextQuestion: string;
}

interface Message {
    role: "assistant" | "user";
    content: string;
}

export default function MockInterviewPage() {
    // Setup State
    const [hasStarted, setHasStarted] = useState(false);
    const [projectTitle, setProjectTitle] = useState("");
    const [projectDescription, setProjectDescription] = useState("");

    // Interview State
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<string>("");
    const [isRecording, setIsRecording] = useState(false);
    const [transcribedText, setTranscribedText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [recognition, setRecognition] = useState<any>(null);
    const [questionCount, setQuestionCount] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognitionInstance = new SpeechRecognition();
                recognitionInstance.continuous = true;
                recognitionInstance.interimResults = true;

                recognitionInstance.onresult = (event: any) => {
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

                recognitionInstance.onerror = (event: any) => {
                    console.error("Speech recognition error", event.error);
                    setIsRecording(false);
                };

                setRecognition(recognitionInstance);
            }
        }
    }, []);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, feedback]);

    const startInterview = async () => {
        if (!projectTitle.trim() || !projectDescription.trim()) {
            alert("Please fill in your project details to ensure a personalized interview.");
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
                    type: "mock",
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
        if (!recognition) {
            alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
            return;
        }

        if (isRecording) {
            recognition.stop();
            setIsRecording(false);
        } else {
            recognition.start();
            setIsRecording(true);
        }
    };

    const handleSubmitAnswer = async () => {
        if (!transcribedText.trim()) return;

        const userMsg: Message = { role: "user", content: transcribedText };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);
        setFeedback(null); // Clear previous feedback

        try {
            const res = await fetch("/api/interview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: messages.map(m => ({ role: m.role, content: m.content })),
                    userResponse: transcribedText,
                    questionCount: questionCount,
                    type: "mock",
                    projectContext: `Title: ${projectTitle}\nDescription: ${projectDescription}`
                }),
            });
            const data = await res.json();
            setFeedback(data);
            setTranscribedText(""); // Clear input
        } catch (error) {
            console.error("Failed to submit answer", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNextQuestion = () => {
        if (questionCount >= 25) {
            setIsCompleted(true);
            return;
        }

        if (feedback?.nextQuestion) {
            const nextQ = feedback.nextQuestion;
            setCurrentQuestion(nextQ);
            setMessages(prev => [...prev, { role: "assistant", content: nextQ }]);
            setFeedback(null);
            setQuestionCount(prev => prev + 1);
        }
    };

    const getStageName = () => {
        if (questionCount <= 2) return "Introduction";
        if (questionCount <= 10) return "Project Deep Dive";
        if (questionCount <= 20) return "Technical Round";
        return "Behavioural Round";
    };

    if (!hasStarted) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-[#0e0e0e] p-6 text-white">
                <div className="w-full max-w-2xl rounded-2xl border border-gray-800 bg-[#161616] p-8 shadow-2xl">
                    <div className="mb-8 text-center">
                        <div className="mb-4 inline-flex rounded-full bg-yellow-900/20 p-4">
                            <Trophy className="h-8 w-8 text-yellow-500" />
                        </div>
                        <h1 className="mb-2 text-3xl font-bold">Full Mock Interview</h1>
                        <p className="text-gray-400">
                            A comprehensive 25-question session covering Intro, Project, Technical, and HR rounds.
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
                                className="w-full rounded-xl border border-gray-700 bg-[#0e0e0e] px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-300">Project Description & Tech Stack</label>
                            <textarea
                                value={projectDescription}
                                onChange={(e) => setProjectDescription(e.target.value)}
                                placeholder="Briefly describe your project and the technologies used (e.g., React, Node.js, MongoDB)..."
                                className="h-32 w-full resize-none rounded-xl border border-gray-700 bg-[#0e0e0e] px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                            />
                        </div>

                        <button
                            onClick={startInterview}
                            className="w-full rounded-xl bg-yellow-600 py-4 font-bold text-black transition-transform hover:scale-[1.02] hover:bg-yellow-500 active:scale-[0.98]"
                        >
                            Start Mock Interview
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
                        <div className="rounded-full bg-yellow-900/20 p-6">
                            <Trophy className="h-12 w-12 text-yellow-500" />
                        </div>
                    </div>
                    <h1 className="mb-4 text-3xl font-bold">Mock Interview Completed!</h1>
                    <p className="mb-8 text-gray-400">
                        Congratulations on completing the full mock interview. Review your feedback to improve.
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
        <div className="flex h-screen flex-col bg-[#0e0e0e] text-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-800 bg-[#161616] px-6 py-4">
                <div className="flex items-center gap-4">
                    <Link href="/interview" className="text-gray-400 hover:text-white">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">Mock Interview</h1>
                        <span className="text-sm text-yellow-500 font-medium">{getStageName()}</span>
                    </div>
                </div>
                <div className="rounded-full bg-yellow-900/20 px-4 py-1 text-sm font-medium text-yellow-500">
                    Question {questionCount}/25
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Chat Area */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="mx-auto max-w-3xl space-y-6">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-6 py-4 ${msg.role === "user"
                                                ? "bg-blue-600 text-white"
                                                : "bg-[#1e1e1e] text-gray-200"
                                            }`}
                                    >
                                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                    </div>
                                </div>
                            ))}

                            {/* Feedback Card */}
                            {feedback && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="rounded-xl border border-gray-800 bg-[#161616] p-6 shadow-xl">
                                        <div className="mb-4 flex items-center justify-between">
                                            <h3 className="text-lg font-semibold text-purple-400">AI Feedback</h3>
                                            <div className="flex items-center gap-1 rounded-full bg-yellow-900/20 px-3 py-1 text-yellow-400">
                                                <Star className="h-4 w-4 fill-current" />
                                                <span className="font-bold">{feedback.rating}/10</span>
                                            </div>
                                        </div>

                                        <div className="mb-6 space-y-4">
                                            <div>
                                                <h4 className="mb-2 text-sm font-medium text-gray-400">Analysis</h4>
                                                <p className="text-sm leading-relaxed text-gray-300">{feedback.feedback}</p>
                                            </div>

                                            <div className="rounded-lg bg-green-900/10 p-4 border border-green-900/30">
                                                <h4 className="mb-2 text-sm font-medium text-green-400">Suggested "Perfect" Answer</h4>
                                                <p className="text-sm leading-relaxed text-green-100/80 italic">"{feedback.suggestedAnswer}"</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleNextQuestion}
                                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-white py-3 font-semibold text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            Next Question <ArrowRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="flex items-center gap-2 rounded-2xl bg-[#1e1e1e] px-6 py-4 text-gray-400">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>AI is thinking...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="border-t border-gray-800 bg-[#161616] p-6">
                        <div className="mx-auto max-w-3xl">
                            {!feedback && (
                                <div className="flex gap-4">
                                    <button
                                        onClick={toggleRecording}
                                        className={`flex h-14 w-14 flex-none items-center justify-center rounded-full transition-all ${isRecording
                                                ? "bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                                                : "bg-[#2a2a2a] text-gray-400 hover:bg-[#333] hover:text-white"
                                            }`}
                                    >
                                        {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                                    </button>

                                    <div className="relative flex-1">
                                        <textarea
                                            value={transcribedText}
                                            onChange={(e) => setTranscribedText(e.target.value)}
                                            placeholder={isRecording ? "Listening..." : "Type your answer or use microphone..."}
                                            className="h-14 w-full resize-none rounded-xl border border-gray-700 bg-[#0e0e0e] px-4 py-3 pr-12 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSubmitAnswer();
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={handleSubmitAnswer}
                                            disabled={!transcribedText.trim() || isLoading}
                                            className="absolute right-2 top-2 rounded-lg p-2 text-blue-500 transition-colors hover:bg-blue-900/20 disabled:opacity-50"
                                        >
                                            <Send className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                            {feedback && (
                                <div className="text-center text-sm text-gray-500">
                                    Review the feedback above and click "Next Question" to continue.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
