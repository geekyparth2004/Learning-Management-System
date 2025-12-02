"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, Volume2, Loader2, ArrowRight, Clock, CheckCircle } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useWhisper } from "@/hooks/use-whisper";

interface AIInterviewPlayerProps {
    topic: string;
    questionCountLimit: number;
    difficulty?: string;
    reviewStatus?: string; // "PENDING" | "APPROVED" | "REJECTED" | null
    onComplete: () => void;
    onSubmitReview: (messages: any[]) => void;
}

export default function AIInterviewPlayer({
    topic,
    questionCountLimit,
    difficulty = "Medium",
    reviewStatus,
    onComplete,
    onSubmitReview
}: AIInterviewPlayerProps) {
    // Interview State
    const [hasStarted, setHasStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [questionCount, setQuestionCount] = useState(0);
    const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);

    // UI State
    const [isSpeaking, setIsSpeaking] = useState(false);
    const synthesisRef = useRef<SpeechSynthesis | null>(null);

    // Whisper Hook
    const {
        isRecording,
        isModelLoading,
        isTranscribing,
        transcribedText,
        setTranscribedText,
        startRecording,
        stopRecording,
        error
    } = useWhisper();

    // Initialize Speech Synthesis
    useEffect(() => {
        if (typeof window !== "undefined" && window.speechSynthesis) {
            synthesisRef.current = window.speechSynthesis;
        }
    }, []);

    // Speak Question
    useEffect(() => {
        if (currentQuestion && hasStarted) {
            speakText(currentQuestion);
        }
    }, [currentQuestion, hasStarted]);

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
        setHasStarted(true);
        setIsLoading(true);
        try {
            const res = await fetch("/api/interview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [],
                    questionCount: 0,
                    type: "custom",
                    subject: topic,
                    difficulty: difficulty
                }),
            });
            const data = await res.json();
            if (data.error) {
                alert("Failed to generate question: " + data.error);
                return;
            }
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

    const toggleRecording = async () => {
        if (isRecording) {
            stopRecording();
        } else {
            if (isSpeaking && synthesisRef.current) {
                synthesisRef.current.cancel();
                setIsSpeaking(false);
            }
            setTranscribedText("");
            await startRecording();
        }
    };

    const handleSubmitAnswer = async () => {
        if (!transcribedText.trim()) return;

        if (isRecording) {
            stopRecording();
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
                    type: "custom",
                    subject: topic,
                    difficulty: difficulty
                }),
            });
            const data = await res.json();
            if (data.error) {
                alert("Failed to evaluate answer: " + data.error);
                return;
            }

            setTranscribedText("");

            // Check if we should end the interview
            if (questionCount >= questionCountLimit) {
                // Add the last assistant message (if any) or just submit
                onSubmitReview(updatedMessages);
                return;
            }

            if (data.nextQuestion) {
                setCurrentQuestion(data.nextQuestion);
                setMessages(prev => [...prev, { role: "assistant", content: data.nextQuestion }]);
                setQuestionCount(prev => prev + 1);
            }
        } catch (error) {
            console.error("Failed to submit answer", error);
        } finally {
            setIsLoading(false);
        }
    };

    const router = useRouter();
    const params = useParams();
    const courseId = params.id;

    if (reviewStatus === "PENDING") {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                <div className="mb-6 rounded-full bg-green-900/20 p-6">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <h2 className="mb-2 text-2xl font-bold">Thank You for Attending</h2>
                <p className="text-gray-400 max-w-md mb-8">
                    The teacher will look over your answer and authenticate.
                </p>
                <button
                    onClick={() => router.push(`/courses/${courseId}`)}
                    className="rounded-xl bg-gray-800 px-8 py-3 font-bold text-white hover:bg-gray-700 border border-gray-700"
                >
                    Go to Modules
                </button>
            </div>
        );
    }

    if (reviewStatus === "REJECTED") {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                <div className="mb-6 rounded-full bg-red-900/20 p-6">
                    <div className="h-12 w-12 text-red-500 font-bold text-3xl flex items-center justify-center">!</div>
                </div>
                <h2 className="mb-2 text-2xl font-bold">Interview Rejected</h2>
                <p className="mb-8 text-gray-400 max-w-md">
                    Your teacher has reviewed your interview and requested you to try again.
                </p>
                <button
                    onClick={startInterview}
                    className="rounded-xl bg-indigo-600 px-8 py-3 font-bold text-white hover:bg-indigo-700"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!hasStarted) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <h2 className="mb-4 text-2xl font-bold">AI Interview: {topic}</h2>
                <div className="mb-8 space-y-2">
                    <p className="text-gray-400">
                        You will be asked {questionCountLimit} questions about {topic}.
                    </p>
                    <div className="inline-flex items-center gap-2 rounded-full bg-gray-800 px-3 py-1 text-sm text-gray-300">
                        <span>Difficulty:</span>
                        <span className={`font - bold ${difficulty === "Hard" ? "text-red-400" :
                            difficulty === "Medium" ? "text-yellow-400" :
                                "text-green-400"
                            } `}>{difficulty}</span>
                    </div>
                </div>
                <button
                    onClick={startInterview}
                    className="rounded-xl bg-indigo-600 px-8 py-3 font-bold text-white hover:bg-indigo-700"
                >
                    Start Interview
                </button>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl p-6 h-full flex flex-col">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between shrink-0">
                <span className="text-sm font-medium text-indigo-500">{topic} Round</span>
                <div className="text-sm font-medium text-gray-400">
                    Q{questionCount}/{questionCountLimit}
                </div>
            </div>

            {/* Question Card */}
            <div className="animate-in fade-in zoom-in-95 duration-500 pb-20 flex-1 overflow-y-auto">
                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold leading-tight md:text-3xl">
                        {currentQuestion}
                    </h2>
                </div>

                {/* Interaction Area */}
                <div className="flex flex-col items-center justify-center gap-8">
                    {isSpeaking ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-indigo-500/20">
                                <Volume2 className="h-10 w-10 animate-pulse text-indigo-400" />
                                <div className="absolute inset-0 animate-ping rounded-full bg-indigo-500/20"></div>
                            </div>
                            <p className="text-indigo-400">Speaking question...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-6 w-full">
                            <button
                                onClick={toggleRecording}
                                className={`group relative flex h - 24 w - 24 items - center justify - center rounded - full transition - all ${isRecording
                                    ? "bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)] scale-110"
                                    : "bg-indigo-600 hover:bg-indigo-500 hover:scale-105 shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                                    } `}
                            >
                                {isRecording ? (
                                    <div className="h-8 w-8 rounded bg-white" />
                                ) : (
                                    <Mic className="h-10 w-10 text-white" />
                                )}
                            </button>

                            <p className="text-lg text-gray-400">
                                {error ? (
                                    <span className="text-red-500">Error: {error}</span>
                                ) : isModelLoading ? (
                                    <span className="flex items-center gap-2 text-yellow-500">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Loading AI...
                                    </span>
                                ) : isTranscribing ? (
                                    <span className="flex items-center gap-2 text-blue-400">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Transcribing...
                                    </span>
                                ) : isRecording
                                    ? "Listening..."
                                    : "Click mic to answer"
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
                                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Next Question"}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
