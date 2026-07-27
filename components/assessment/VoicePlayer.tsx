"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, Volume2, Loader2, Clock, CheckCircle } from "lucide-react";

interface VoicePlayerProps {
    topic: string;
    questionCount: number;
    level: number;
    onComplete: () => void;
}

const LEVEL_LABELS: Record<number, string> = {
    1: "Beginner", 2: "Beginner+", 3: "Elementary", 4: "Elementary+", 5: "Intermediate",
    6: "Intermediate+", 7: "Advanced", 8: "Advanced+", 9: "Expert", 10: "Master",
};

export default function VoicePlayer({ topic, questionCount, level, onComplete }: VoicePlayerProps) {
    const [hasStarted, setHasStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [qCount, setQCount] = useState(0);
    const [messages, setMessages] = useState<{ role: string; content: string; audioUrl?: string }[]>([]);
    const [duration, setDuration] = useState(0);

    // Audio recording
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const synthesisRef = useRef<SpeechSynthesis | null>(null);

    const difficulty = LEVEL_LABELS[level] || "Intermediate";

    // Timer
    useEffect(() => {
        if (!hasStarted) return;
        const timer = setInterval(() => setDuration(prev => prev + 1), 1000);
        return () => clearInterval(timer);
    }, [hasStarted]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // Speech synthesis
    useEffect(() => {
        if (typeof window !== "undefined" && window.speechSynthesis) {
            synthesisRef.current = window.speechSynthesis;
        }
    }, []);

    useEffect(() => {
        if (currentQuestion && hasStarted) {
            speakText(currentQuestion);
        }
    }, [currentQuestion, hasStarted]);

    function speakText(text: string) {
        if (!synthesisRef.current) return;
        synthesisRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        const voices = synthesisRef.current.getVoices();
        const preferred = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha"));
        if (preferred) utterance.voice = preferred;
        synthesisRef.current.speak(utterance);
    }

    async function startInterview() {
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
                    difficulty,
                }),
            });
            const data = await res.json();
            if (data.nextQuestion) {
                setCurrentQuestion(data.nextQuestion);
                setMessages([{ role: "assistant", content: data.nextQuestion }]);
                setQCount(1);
            }
        } catch (err) {
            console.error("Failed to start voice round", err);
        } finally {
            setIsLoading(false);
        }
    }

    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
            chunksRef.current = [];
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };
            recorder.onstop = async () => {
                stream.getTracks().forEach(t => t.stop());
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                await handleRecordingComplete(blob);
            };
            recorder.start();
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
        } catch (err) {
            console.error("Mic error:", err);
            alert("Microphone access denied. Please allow microphone access.");
        }
    }

    function stopRecording() {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }

    async function handleRecordingComplete(blob: Blob) {
        setIsUploading(true);
        try {
            // Upload audio
            const presignRes = await fetch("/api/upload/presigned-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filename: `voice-assess-${Date.now()}.webm`,
                    contentType: "audio/webm",
                    contentLength: blob.size,
                }),
            });
            if (!presignRes.ok) throw new Error("Failed to get upload URL");
            const { uploadUrl, publicUrl } = await presignRes.json();

            await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": "audio/webm" }, body: blob });

            await submitAnswer(publicUrl);
        } catch (err) {
            console.error("Upload failed", err);
            alert("Failed to upload audio. Please try again.");
            setIsUploading(false);
        }
    }

    async function submitAnswer(audioUrl: string) {
        const placeholderText = "[Audio Response Provided]";
        const userMsg = { role: "user", content: placeholderText, audioUrl };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setIsLoading(true);

        try {
            const res = await fetch("/api/interview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: updatedMessages,
                    userResponse: placeholderText,
                    questionCount: qCount,
                    type: "custom",
                    subject: topic,
                    difficulty,
                }),
            });
            const data = await res.json();

            if (qCount >= questionCount) {
                onComplete();
                return;
            }

            if (data.nextQuestion) {
                setCurrentQuestion(data.nextQuestion);
                setMessages(prev => [...prev, { role: "assistant", content: data.nextQuestion }]);
                setQCount(prev => prev + 1);
            }
        } catch (err) {
            console.error("Submit failed", err);
        } finally {
            setIsLoading(false);
            setIsUploading(false);
        }
    }

    function toggleRecording() {
        if (isRecording) {
            stopRecording();
        } else {
            if (isSpeaking && synthesisRef.current) {
                synthesisRef.current.cancel();
                setIsSpeaking(false);
            }
            startRecording();
        }
    }

    // Pre-start screen
    if (!hasStarted) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
                <div className="mb-6 rounded-full bg-green-500/20 p-6">
                    <Mic className="h-12 w-12 text-green-400" />
                </div>
                <h2 className="mb-2 text-2xl font-bold">Voice Interview Round</h2>
                <p className="text-gray-400 mb-2">Topic: <span className="text-green-400 font-bold">{topic}</span></p>
                <p className="text-gray-400 mb-6">{questionCount} questions • {difficulty} difficulty</p>
                <button onClick={startInterview}
                    className="rounded-xl bg-green-600 px-8 py-3 font-bold text-white hover:bg-green-500 transition-colors"
                >
                    Start Voice Round
                </button>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl p-6 h-full flex flex-col">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between shrink-0">
                <span className="text-sm font-medium text-green-400">
                    <Mic className="inline h-4 w-4 mr-1" />
                    Voice Round — {topic}
                </span>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                        <Clock className="w-4 h-4 mr-2 text-green-400" />
                        <span className="font-mono text-sm">{formatTime(duration)}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-400">
                        Q{qCount}/{questionCount}
                    </div>
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full rounded-full bg-gray-800 overflow-hidden mb-8 shrink-0">
                <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${(qCount / questionCount) * 100}%` }} />
            </div>

            {/* Question */}
            <div className="pb-20 flex-1 overflow-y-auto">
                {isLoading && !currentQuestion ? (
                    <div className="flex items-center justify-center gap-3 text-gray-400">
                        <Loader2 className="h-5 w-5 animate-spin" /> Loading question...
                    </div>
                ) : (
                    <>
                        <div className="mb-8 text-center">
                            <h2 className="text-2xl font-bold leading-tight md:text-3xl">{currentQuestion}</h2>
                        </div>

                        <div className="flex flex-col items-center justify-center gap-8">
                            {isSpeaking ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-green-500/20">
                                        <Volume2 className="h-10 w-10 animate-pulse text-green-400" />
                                        <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20" />
                                    </div>
                                    <p className="text-green-400">Speaking question...</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-6 w-full">
                                    <button onClick={toggleRecording} disabled={isLoading || isUploading}
                                        className={`group relative flex h-24 w-24 items-center justify-center rounded-full transition-all ${
                                            isRecording
                                                ? "bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)] scale-110"
                                                : "bg-green-600 hover:bg-green-500 hover:scale-105 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                                        } disabled:opacity-50`}
                                    >
                                        {isRecording ? (
                                            <div className="h-8 w-8 rounded bg-white" />
                                        ) : (
                                            <Mic className="h-10 w-10 text-white" />
                                        )}
                                    </button>

                                    <p className="text-lg text-gray-400">
                                        {isRecording ? "Listening... (click to stop)" :
                                         isUploading ? "Uploading audio..." :
                                         isLoading ? "Processing..." :
                                         "Click mic to answer"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
