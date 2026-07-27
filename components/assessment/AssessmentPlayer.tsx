"use client";

import React, { useState } from "react";
import { CheckSquare, Code, Mic, ChevronRight, Play, Clock, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import MCQPlayer from "./MCQPlayer";
import CodingPlayer from "./CodingPlayer";
import VoicePlayer from "./VoicePlayer";

interface RoundConfig {
    type: "mcq" | "coding" | "voice";
    role?: string;
    level?: number;
    questionCount?: number;
    problemCount?: number;
    topic?: string;
}

interface AssessmentPlayerProps {
    assessmentId: string;
    title: string;
    config: { rounds: RoundConfig[]; description?: string };
    duration: number;
    isRegistered: boolean;
    userId: string;
}

const ROUND_META: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    mcq: { label: "MCQ Round", icon: CheckSquare, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/30" },
    coding: { label: "Coding Round", icon: Code, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30" },
    voice: { label: "Voice Round", icon: Mic, color: "text-green-400", bg: "bg-green-500/10 border-green-500/30" },
};

export default function AssessmentPlayer({ assessmentId, title, config, duration, isRegistered, userId }: AssessmentPlayerProps) {
    const router = useRouter();
    const [hasStarted, setHasStarted] = useState(false);
    const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
    const [roundResults, setRoundResults] = useState<any[]>([]);
    const [isComplete, setIsComplete] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);

    const rounds = config.rounds || [];

    // Timer
    React.useEffect(() => {
        if (!hasStarted || isComplete) return;
        const timer = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
        return () => clearInterval(timer);
    }, [hasStarted, isComplete]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    async function handleStart() {
        // Register
        if (!isRegistered) {
            try {
                await fetch(`/api/contest/${assessmentId}/join`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                });
            } catch (e) {
                console.error("Registration failed", e);
            }
        }
        setHasStarted(true);
    }

    function handleRoundComplete(result: any) {
        const newResults = [...roundResults, result];
        setRoundResults(newResults);

        if (currentRoundIndex < rounds.length - 1) {
            setCurrentRoundIndex(prev => prev + 1);
        } else {
            // All rounds done
            setIsComplete(true);
            // Submit completion
            fetch(`/api/contest/${assessmentId}/complete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ results: newResults, duration: elapsedTime }),
            }).catch(console.error);
        }
    }

    // ── Not started: Show assessment overview ──
    if (!hasStarted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="max-w-2xl w-full space-y-8">
                    <div className="text-center space-y-3">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
                            {title}
                        </h1>
                        {config.description && (
                            <p className="text-gray-400">{config.description}</p>
                        )}
                        {duration > 0 && (
                            <div className="inline-flex items-center gap-2 rounded-full bg-gray-800 px-4 py-1.5 text-sm text-gray-300">
                                <Clock className="h-4 w-4 text-purple-400" />
                                <span>Duration: {duration} minutes</span>
                            </div>
                        )}
                    </div>

                    <div className="rounded-xl border border-gray-800 bg-[#161616] p-6 space-y-4">
                        <h2 className="font-bold text-gray-300 text-sm uppercase tracking-wider">Assessment Rounds</h2>
                        <div className="space-y-3">
                            {rounds.map((round, idx) => {
                                const meta = ROUND_META[round.type];
                                const Icon = meta.icon;
                                return (
                                    <div key={idx} className={`flex items-center gap-4 rounded-lg border p-4 ${meta.bg}`}>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30">
                                            <Icon className={`h-5 w-5 ${meta.color}`} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`font-bold ${meta.color}`}>{meta.label}</h3>
                                            <p className="text-xs text-gray-400">
                                                {round.type === "mcq" && `${round.questionCount || 10} questions • Role: ${round.role} • Level ${round.level}/10`}
                                                {round.type === "coding" && `${round.problemCount || 3} problems • Level ${round.level}/10`}
                                                {round.type === "voice" && `${round.questionCount || 10} questions • Topic: ${round.topic} • Level ${round.level}/10`}
                                            </p>
                                        </div>
                                        <div className="text-sm text-gray-500 font-mono">Round {idx + 1}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <button onClick={handleStart}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 py-4 font-bold text-white hover:from-pink-500 hover:to-purple-500 transition-all shadow-lg shadow-purple-500/20 text-lg"
                    >
                        <Play className="h-5 w-5" /> Start Assessment
                    </button>
                </div>
            </div>
        );
    }

    // ── Complete: Show results ──
    if (isComplete) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="max-w-2xl w-full text-center space-y-8">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
                        <Trophy className="h-10 w-10 text-green-400" />
                    </div>
                    <h1 className="text-3xl font-bold">Assessment Complete!</h1>
                    <p className="text-gray-400">You completed {title} in {formatTime(elapsedTime)}</p>

                    <div className="space-y-3">
                        {roundResults.map((result, idx) => {
                            const round = rounds[idx];
                            const meta = ROUND_META[round.type];
                            return (
                                <div key={idx} className="flex items-center justify-between rounded-lg border border-gray-800 bg-[#161616] p-4">
                                    <span className={`font-bold ${meta.color}`}>{meta.label}</span>
                                    <span className="text-gray-300">
                                        {result.score !== undefined ? `Score: ${result.score}` : "Completed ✓"}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <button onClick={() => router.push("/assessment")}
                        className="rounded-xl bg-gray-800 px-8 py-3 font-bold text-white hover:bg-gray-700 border border-gray-700"
                    >
                        Back to Assessments
                    </button>
                </div>
            </div>
        );
    }

    // ── In progress: Show current round ──
    const currentRound = rounds[currentRoundIndex];

    return (
        <div className="min-h-screen flex flex-col">
            {/* Top bar */}
            <div className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-800 bg-[#0e0e0e]/90 backdrop-blur px-4 py-3">
                <div className="flex items-center gap-3">
                    {rounds.map((round, idx) => {
                        const meta = ROUND_META[round.type];
                        const Icon = meta.icon;
                        const isActive = idx === currentRoundIndex;
                        const isDone = idx < currentRoundIndex;
                        return (
                            <div key={idx} className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                                isActive ? `${meta.bg} ${meta.color} border` : isDone ? "bg-green-500/10 text-green-400 border border-green-500/30" : "bg-gray-800 text-gray-500"
                            }`}>
                                <Icon className="h-3.5 w-3.5" />
                                {meta.label}
                                {isDone && " ✓"}
                                {idx < rounds.length - 1 && <ChevronRight className="h-3 w-3 text-gray-600 ml-1" />}
                            </div>
                        );
                    })}
                </div>
                <div className="flex items-center gap-2 rounded-full bg-gray-800 px-3 py-1.5 text-sm text-gray-300">
                    <Clock className="h-4 w-4 text-purple-400" />
                    <span className="font-mono">{formatTime(elapsedTime)}</span>
                </div>
            </div>

            {/* Round content */}
            <div className="flex-1">
                {currentRound.type === "mcq" && (
                    <MCQPlayer
                        role={currentRound.role || "Software Development Engineer"}
                        level={currentRound.level || 5}
                        questionCount={currentRound.questionCount || 10}
                        onComplete={(score) => handleRoundComplete({ type: "mcq", score })}
                    />
                )}
                {currentRound.type === "coding" && (
                    <CodingPlayer
                        level={currentRound.level || 5}
                        problemCount={currentRound.problemCount || 3}
                        onComplete={(results) => handleRoundComplete({ type: "coding", ...results })}
                    />
                )}
                {currentRound.type === "voice" && (
                    <VoicePlayer
                        topic={currentRound.topic || "General"}
                        questionCount={currentRound.questionCount || 10}
                        level={currentRound.level || 5}
                        onComplete={() => handleRoundComplete({ type: "voice", completed: true })}
                    />
                )}
            </div>
        </div>
    );
}
