"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, Volume2, Loader2, Clock, Sparkles, TrendingUp } from "lucide-react";
import { nextLevel, levelLabel, LEVEL_LABELS } from "@/lib/adaptive";

export interface VoiceRoundResult {
    score: number;
    maxScore: number;
    adaptive: boolean;
    highestLevel?: number;
    finalLevel?: number;
    questions: {
        question: string;
        transcript: string;
        marks: number;
        feedback: string;
        level?: number;
    }[];
}

interface VoicePlayerProps {
    topic: string;
    questionCount: number;
    level: number;
    adaptive?: boolean;
    onComplete: (result: VoiceRoundResult) => void;
}

// An answer scoring at least this many of 5 marks counts as "correct" and raises the level.
const ADAPTIVE_PASS_MARK = 3;

export default function VoicePlayer({ topic, questionCount, level, adaptive = false, onComplete }: VoicePlayerProps) {
    const [hasStarted, setHasStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [qCount, setQCount] = useState(0);
    const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
    const [duration, setDuration] = useState(0);

    // Audio recording
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const synthesisRef = useRef<SpeechSynthesis | null>(null);
    // Refs so async handlers always see the latest question/evaluations
    const currentQuestionRef = useRef<string>("");
    const evaluationsRef = useRef<VoiceRoundResult["questions"]>([]);

    // Adaptive state: the round starts at level 1 and moves with the AI marks.
    const [currentLevel, setCurrentLevel] = useState(1);
    const currentLevelRef = useRef(1);
    const highestLevelRef = useRef(1);
    const askedRef = useRef<string[]>([]);

    const difficulty = adaptive ? levelLabel(currentLevel) : (LEVEL_LABELS[level] || "Intermediate");

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
        currentQuestionRef.current = currentQuestion;
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

    const fetchAdaptiveQuestion = useCallback(async (atLevel: number) => {
        const res = await fetch("/api/assessment/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "voice",
                topic,
                level: atLevel,
                exclude: askedRef.current,
            }),
        });
        const data = await res.json();
        if (data.error || !data.question) throw new Error(data.error || "Failed to generate the next question");
        return data.question as string;
    }, [topic]);

    async function startInterview() {
        setHasStarted(true);
        setIsLoading(true);
        try {
            if (adaptive) {
                const question = await fetchAdaptiveQuestion(1);
                askedRef.current = [question];
                setCurrentQuestion(question);
                setQCount(1);
            } else {
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
        setIsEvaluating(true);
        const question = currentQuestionRef.current;
        const askedAtLevel = currentLevelRef.current;

        // AI evaluation: transcribe + grade out of 5 marks. The recording itself is never stored.
        let evaluation: VoiceRoundResult["questions"][number] = {
            question,
            transcript: "",
            marks: 0,
            feedback: "Answer could not be evaluated.",
            ...(adaptive ? { level: askedAtLevel } : {}),
        };
        try {
            const formData = new FormData();
            formData.append("audio", new File([blob], "answer.webm", { type: "audio/webm" }));
            formData.append("question", question);
            formData.append("topic", topic);
            formData.append("difficulty", difficulty);

            const res = await fetch("/api/assessment/voice-evaluate", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (!data.error) {
                evaluation = {
                    question,
                    transcript: data.transcript || "",
                    marks: typeof data.marks === "number" ? data.marks : 0,
                    feedback: data.feedback || "",
                    ...(adaptive ? { level: askedAtLevel } : {}),
                };
            }
        } catch (err) {
            console.error("Voice evaluation failed", err);
        }

        evaluationsRef.current = [...evaluationsRef.current, evaluation];
        await advanceToNextQuestion(evaluation.transcript, evaluation.marks);
    }

    async function advanceToNextQuestion(transcript: string, marks: number) {
        const answerText = transcript || "[No answer detected]";

        try {
            if (qCount >= questionCount) {
                finishRound();
                return;
            }

            if (adaptive) {
                // Marks at or above the pass mark raise the difficulty, below it lowers.
                const upcomingLevel = nextLevel(currentLevelRef.current, marks >= ADAPTIVE_PASS_MARK);
                currentLevelRef.current = upcomingLevel;
                setCurrentLevel(upcomingLevel);
                if (upcomingLevel > highestLevelRef.current) highestLevelRef.current = upcomingLevel;

                setIsLoading(true);
                const question = await fetchAdaptiveQuestion(upcomingLevel);
                askedRef.current = [...askedRef.current, question];
                setCurrentQuestion(question);
                setQCount(prev => prev + 1);
                return;
            }

            const updatedMessages = [...messages, { role: "user", content: answerText }];
            setMessages(updatedMessages);
            setIsLoading(true);

            const res = await fetch("/api/interview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: updatedMessages,
                    userResponse: answerText,
                    questionCount: qCount,
                    type: "custom",
                    subject: topic,
                    difficulty,
                }),
            });
            const data = await res.json();

            if (data.nextQuestion) {
                setCurrentQuestion(data.nextQuestion);
                setMessages(prev => [...prev, { role: "assistant", content: data.nextQuestion }]);
                setQCount(prev => prev + 1);
            } else {
                finishRound();
            }
        } catch (err) {
            console.error("Failed to get next question", err);
            // Don't strand the student on a dead screen — close the round with what was graded.
            finishRound();
        } finally {
            setIsLoading(false);
            setIsEvaluating(false);
        }
    }

    function finishRound() {
        const evaluations = evaluationsRef.current;
        const score = evaluations.reduce((sum, e) => sum + e.marks, 0);
        onComplete({
            score,
            maxScore: questionCount * 5,
            adaptive,
            ...(adaptive ? { highestLevel: highestLevelRef.current, finalLevel: currentLevelRef.current } : {}),
            questions: evaluations,
        });
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
                {adaptive ? (
                    <p className="text-gray-400 mb-2">
                        {questionCount} questions •{" "}
                        <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-400 align-middle">
                            <TrendingUp className="h-3 w-3" /> ADAPTIVE
                        </span>{" "}
                        starting at Level 1
                    </p>
                ) : (
                    <p className="text-gray-400 mb-2">{questionCount} questions • {difficulty} difficulty</p>
                )}
                <p className="text-xs text-gray-500 mb-6">Each answer is evaluated by AI for up to 5 marks. Recordings are not stored.</p>
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
                <span className="flex items-center gap-2 text-sm font-medium text-green-400">
                    <Mic className="inline h-4 w-4" />
                    Voice Round — {topic}
                    {adaptive && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-400">
                            <TrendingUp className="h-3 w-3" /> ADAPTIVE
                        </span>
                    )}
                </span>
                <div className="flex items-center space-x-4">
                    {adaptive && (
                        <div className="text-xs text-gray-400">
                            Level {currentLevel} · {levelLabel(currentLevel)}
                        </div>
                    )}
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
                ) : isEvaluating || isLoading ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-16">
                        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-purple-500/20">
                            <Sparkles className="h-10 w-10 animate-pulse text-purple-400" />
                            <div className="absolute inset-0 animate-ping rounded-full bg-purple-500/20" />
                        </div>
                        <p className="text-purple-400 font-medium">
                            {isEvaluating ? "AI is evaluating your answer..." : "Preparing your next question..."}
                        </p>
                        <p className="text-xs text-gray-500">Marks will be revealed after the assessment ends</p>
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
                                    <button onClick={toggleRecording} disabled={isLoading || isEvaluating}
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
                                        {isRecording ? "Listening... (click to stop)" : "Click mic to answer"}
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
