"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { CheckSquare, Code, Mic, ChevronRight, Play, Clock, Trophy, Shield, Camera, Maximize, AlertTriangle, X, Send, BarChart3, TrendingUp, Bug, Terminal, Database, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import MCQPlayer from "./MCQPlayer";
import CodingPlayer from "./CodingPlayer";
import VoicePlayer from "./VoicePlayer";
import DebugPlayer from "./DebugPlayer";
import OutputPlayer from "./OutputPlayer";
import SQLPlayer from "./SQLPlayer";
import EmailPlayer from "./EmailPlayer";

interface RoundConfig {
    type: "mcq" | "coding" | "voice" | "debug" | "output" | "sql" | "email";
    role?: string;
    level?: number;
    questionCount?: number;
    problemCount?: number;
    challengeCount?: number;
    language?: "python" | "java" | "cpp";
    topic?: string;
    adaptive?: boolean;
}

interface AssessmentPlayerProps {
    assessmentId: string;
    title: string;
    config: { rounds: RoundConfig[]; description?: string };
    duration: number;
    isRegistered: boolean;
    userId: string;
    endTime: string;
}

const ROUND_META: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    mcq: { label: "MCQ Round", icon: CheckSquare, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/30" },
    coding: { label: "Coding Round", icon: Code, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30" },
    voice: { label: "Voice Round", icon: Mic, color: "text-green-400", bg: "bg-green-500/10 border-green-500/30" },
    debug: { label: "Debug Challenge", icon: Bug, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30" },
    output: { label: "Output Prediction", icon: Terminal, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/30" },
    sql: { label: "SQL Round", icon: Database, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/30" },
    email: { label: "Email Writing", icon: Mail, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
};

export default function AssessmentPlayer({ assessmentId, title, config, duration, isRegistered, userId, endTime }: AssessmentPlayerProps) {
    const router = useRouter();
    const [hasStarted, setHasStarted] = useState(false);
    const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
    const [roundResults, setRoundResults] = useState<any[]>([]);
    const [isComplete, setIsComplete] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);

    const [securityStep, setSecurityStep] = useState(0);
    const [warningCount, setWarningCount] = useState(0);
    const [showWarning, setShowWarning] = useState(false);
    const [warningMessage, setWarningMessage] = useState("");
    const [cameraError, setCameraError] = useState("");
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [timeExpired, setTimeExpired] = useState(false);
    const cameraStreamRef = useRef<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const isSubmittingRef = useRef(false);
    const warningCountRef = useRef(0);
    const elapsedTimeRef = useRef(0);
    // Timer callbacks fire outside React's render flow, so the latest round results
    // are mirrored into a ref for the time-up auto-submit to read.
    const roundResultsRef = useRef<any[]>([]);

    const rounds = config.rounds || [];

    // The teacher-set duration is the countdown budget. Without one, the round is untimed.
    const totalSeconds = duration > 0 ? duration * 60 : 0;
    const hasTimeLimit = totalSeconds > 0;
    const [remainingTime, setRemainingTime] = useState(totalSeconds);

    React.useEffect(() => {
        if (!hasStarted || isComplete) return;
        const timer = setInterval(() => {
            elapsedTimeRef.current += 1;
            setElapsedTime(elapsedTimeRef.current);
            if (hasTimeLimit) {
                setRemainingTime(prev => Math.max(0, prev - 1));
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [hasStarted, isComplete, hasTimeLimit]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // Countdown display: h:mm:ss once past an hour, m:ss below it.
    const formatCountdown = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const submitAssessment = useCallback(async (resultRounds: any[], autoSubmitted: boolean) => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;

        if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach(track => track.stop());
            cameraStreamRef.current = null;
        }

        try {
            await fetch(`/api/contest/${assessmentId}/complete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    results: {
                        rounds: resultRounds,
                        warningCount: warningCountRef.current,
                        autoSubmitted,
                    },
                    duration: elapsedTimeRef.current,
                }),
            });
        } catch (e) {
            console.error("Submission failed", e);
        }

        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        }

        setIsComplete(true);
    }, [assessmentId]);

    const autoSubmitAssessment = useCallback(() => {
        submitAssessment(roundResults, true);
    }, [submitAssessment, roundResults]);

    // Time's up — submit whatever the student has completed so far, immediately.
    useEffect(() => {
        if (!hasStarted || isComplete || !hasTimeLimit) return;
        if (remainingTime > 0) return;
        setTimeExpired(true);
        setWarningMessage("Time is up! Your assessment is being submitted automatically.");
        setShowWarning(true);
        submitAssessment(roundResultsRef.current, true);
    }, [remainingTime, hasStarted, isComplete, hasTimeLimit, submitAssessment]);

    const triggerWarning = useCallback((message: string) => {
        const newCount = warningCountRef.current + 1;
        warningCountRef.current = newCount;
        setWarningCount(newCount);

        if (newCount >= 3) {
            setWarningMessage("Maximum warnings exceeded! Assessment is being auto-submitted.");
            setShowWarning(true);
            setTimeout(() => autoSubmitAssessment(), 2000);
            return;
        }

        setWarningMessage(`${message} (Warning ${newCount}/3)`);
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
    }, [autoSubmitAssessment]);

    const forceFullscreen = useCallback(() => {
        if (!document.fullscreenElement && hasStarted && !isComplete && !isSubmittingRef.current) {
            document.documentElement.requestFullscreen().catch(() => {});
        }
    }, [hasStarted, isComplete]);

    useEffect(() => {
        if (!hasStarted || isComplete) return;

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && !isSubmittingRef.current && !isComplete) {
                triggerWarning("You exited fullscreen mode! Fullscreen is mandatory.");
                setTimeout(forceFullscreen, 300);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden && !isSubmittingRef.current) {
                triggerWarning("Tab switching detected! Stay on the assessment.");
            }
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        document.addEventListener("keydown", handleKeyDown, true);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            document.removeEventListener("keydown", handleKeyDown, true);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [hasStarted, isComplete, triggerWarning, forceFullscreen]);

    useEffect(() => {
        if (videoRef.current && cameraStreamRef.current) {
            videoRef.current.srcObject = cameraStreamRef.current;
        }
    }, [hasStarted]);

    useEffect(() => {
        return () => {
            if (cameraStreamRef.current) {
                cameraStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    async function handleStart() {
        setSecurityStep(1);
    }

    async function handleCameraAccept() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            cameraStreamRef.current = stream;
            setCameraError("");
            setSecurityStep(2);
        } catch {
            setCameraError("Camera access denied. You can still proceed but monitoring will be limited.");
            setSecurityStep(2);
        }
    }

    async function handleFullscreenAccept() {
        try {
            await document.documentElement.requestFullscreen();
            setSecurityStep(3);
        } catch {
            setSecurityStep(3);
        }
    }

    async function handleSecurityComplete() {
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
        setSecurityStep(0);
        setHasStarted(true);
    }

    function handleRoundComplete(result: any) {
        const newResults = [...roundResults, result];
        setRoundResults(newResults);
        roundResultsRef.current = newResults;

        if (currentRoundIndex < rounds.length - 1) {
            setCurrentRoundIndex(prev => prev + 1);
        } else {
            submitAssessment(newResults, false);
        }
    }

    function handleManualSubmit() {
        setShowSubmitConfirm(false);
        submitAssessment(roundResults, false);
    }

    // ── Security Step Modals ──
    if (securityStep > 0 && securityStep <= 3) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    {/* Progress indicator */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        {[1, 2, 3].map(step => (
                            <div key={step} className="flex items-center gap-2">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                    step < securityStep ? "bg-green-500 text-white" :
                                    step === securityStep ? "bg-purple-600 text-white ring-2 ring-purple-400 ring-offset-2 ring-offset-[#0e0e0e]" :
                                    "bg-gray-800 text-gray-500"
                                }`}>
                                    {step < securityStep ? "✓" : step}
                                </div>
                                {step < 3 && (
                                    <div className={`w-12 h-0.5 ${step < securityStep ? "bg-green-500" : "bg-gray-800"}`} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Step 1: Camera */}
                    {securityStep === 1 && (
                        <div className="rounded-xl border border-gray-800 bg-[#161616] p-8 space-y-6 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                                <Camera className="h-8 w-8 text-green-400" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-bold text-white">Enable Camera Monitoring</h2>
                                <p className="text-gray-400 text-sm">
                                    Your camera will be turned on for proctoring purposes. A live preview will be shown in the bottom-right corner. No recording will be stored.
                                </p>
                            </div>
                            <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3">
                                <p className="text-green-400 text-xs flex items-center gap-2">
                                    <Shield className="h-4 w-4 shrink-0" />
                                    Your privacy is protected — camera feed is only used for live monitoring
                                </p>
                            </div>
                            <button onClick={handleCameraAccept}
                                className="w-full rounded-lg bg-green-600 py-3 font-bold text-white hover:bg-green-500 transition-colors"
                            >
                                Allow Camera Access
                            </button>
                        </div>
                    )}

                    {/* Step 2: Fullscreen */}
                    {securityStep === 2 && (
                        <div className="rounded-xl border border-gray-800 bg-[#161616] p-8 space-y-6 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20">
                                <Maximize className="h-8 w-8 text-blue-400" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-bold text-white">Enable Fullscreen Mode</h2>
                                <p className="text-gray-400 text-sm">
                                    This assessment requires fullscreen mode. You will not be allowed to exit fullscreen during the assessment. Attempting to exit will result in a warning.
                                </p>
                            </div>
                            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-3">
                                <p className="text-yellow-400 text-xs flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    3 warnings will result in automatic submission of your assessment
                                </p>
                            </div>
                            <button onClick={handleFullscreenAccept}
                                className="w-full rounded-lg bg-blue-600 py-3 font-bold text-white hover:bg-blue-500 transition-colors"
                            >
                                Enter Fullscreen
                            </button>
                        </div>
                    )}

                    {/* Step 3: Monitoring Notice */}
                    {securityStep === 3 && (
                        <div className="rounded-xl border border-gray-800 bg-[#161616] p-8 space-y-6 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/20">
                                <Shield className="h-8 w-8 text-purple-400" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-bold text-white">Assessment Security Active</h2>
                                <p className="text-gray-400 text-sm">
                                    The following security measures are now active:
                                </p>
                            </div>
                            <div className="space-y-2 text-left">
                                <div className="flex items-center gap-3 rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                                    <Camera className="h-5 w-5 text-green-400 shrink-0" />
                                    <span className="text-sm text-gray-300">Camera monitoring</span>
                                    <span className={`ml-auto text-xs font-bold ${cameraStreamRef.current ? "text-green-400" : "text-yellow-400"}`}>
                                        {cameraStreamRef.current ? "Active" : "Denied"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
                                    <Maximize className="h-5 w-5 text-blue-400 shrink-0" />
                                    <span className="text-sm text-gray-300">Fullscreen mode enforced</span>
                                    <span className="ml-auto text-xs text-green-400 font-bold">Active</span>
                                </div>
                                <div className="flex items-center gap-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
                                    <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0" />
                                    <span className="text-sm text-gray-300">Tab switch detection</span>
                                    <span className="ml-auto text-xs text-green-400 font-bold">Active</span>
                                </div>
                                {hasTimeLimit && (
                                    <div className="flex items-center gap-3 rounded-lg bg-purple-500/10 border border-purple-500/20 p-3">
                                        <Clock className="h-5 w-5 text-purple-400 shrink-0" />
                                        <span className="text-sm text-gray-300">Countdown timer</span>
                                        <span className="ml-auto text-xs text-purple-400 font-bold">{duration} min</span>
                                    </div>
                                )}
                            </div>
                            {cameraError && (
                                <p className="text-yellow-400 text-xs">{cameraError}</p>
                            )}
                            <button onClick={handleSecurityComplete}
                                className="w-full rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 py-3 font-bold text-white hover:from-pink-500 hover:to-purple-500 transition-all"
                            >
                                Begin Assessment
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
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
                        {hasTimeLimit && (
                            <div className="inline-flex items-center gap-2 rounded-full bg-gray-800 px-4 py-1.5 text-sm text-gray-300">
                                <Clock className="h-4 w-4 text-purple-400" />
                                <span>Time limit: {duration} minutes — auto-submits at 0:00</span>
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
                                            <h3 className={`font-bold ${meta.color} flex items-center gap-2`}>
                                                {meta.label}
                                                {round.adaptive && (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-current/30 bg-black/30 px-2 py-0.5 text-[10px] font-bold">
                                                        <TrendingUp className="h-3 w-3" /> ADAPTIVE
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-xs text-gray-400">
                                                {round.type === "mcq" && `${round.questionCount || 10} questions • Role: ${round.role} • ${round.adaptive ? "Starts at Level 1, adapts to your answers" : `Level ${round.level}/10`} • +1 mark per correct answer`}
                                                {round.type === "coding" && `${round.problemCount || 3} problems • ${round.adaptive ? "Starts at Level 1, adapts to your results" : `Level ${round.level}/10`} • +5 marks per passed test case`}
                                                {round.type === "voice" && `${round.questionCount || 10} questions • Topic: ${round.topic} • ${round.adaptive ? "Starts at Level 1, adapts to your marks" : `Level ${round.level}/10`} • Up to 5 marks per answer (AI evaluated)`}
                                                {round.type === "debug" && `${round.challengeCount || 3} buggy programs (${(round.language || "python").toUpperCase()}) • Level ${round.level}/10 • Fix the bugs — +5 marks per program passing all tests`}
                                                {round.type === "output" && `${round.questionCount || 5} code snippets • Level ${round.level}/10 • Predict the exact output — +5 marks per correct prediction`}
                                                {round.type === "sql" && `${round.questionCount || 3} SQL questions • Level ${round.level}/10 • +3 marks per passed test case (visible & hidden)`}
                                                {round.type === "email" && `${round.questionCount || 3} emails to write • Level ${round.level}/10 • Up to 10 marks per email (AI checks grammar & professionalism)`}
                                            </p>
                                        </div>
                                        <div className="text-sm text-gray-500 font-mono">Round {idx + 1}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Security notice before starting */}
                    <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
                        <div className="flex items-start gap-3">
                            <Shield className="h-5 w-5 text-yellow-400 mt-0.5 shrink-0" />
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-yellow-400">Proctored Assessment</p>
                                <p className="text-xs text-gray-400">
                                    This assessment is proctored. You will be asked to enable camera access and fullscreen mode.
                                    Exiting fullscreen or switching tabs will result in warnings. 3 warnings will auto-submit your assessment.
                                    {hasTimeLimit && ` A ${duration}-minute countdown starts when you begin — the assessment submits automatically when it reaches zero.`}
                                    {" "}Scores and the leaderboard are revealed only after the assessment ends for everyone.
                                </p>
                            </div>
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

    // ── Complete: Submission confirmation (scores stay hidden until the assessment ends) ──
    if (isComplete) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="max-w-2xl w-full text-center space-y-8">
                    <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${timeExpired ? "bg-red-500/20" : "bg-green-500/20"}`}>
                        {timeExpired
                            ? <Clock className="h-10 w-10 text-red-400" />
                            : <Trophy className="h-10 w-10 text-green-400" />}
                    </div>
                    <h1 className="text-3xl font-bold">
                        {timeExpired ? "Time's Up — Assessment Submitted" : "Assessment Submitted!"}
                    </h1>
                    <p className="text-gray-400">
                        {timeExpired
                            ? `Your allotted ${duration} minutes ran out, so ${title} was submitted automatically.`
                            : `You completed ${title} in ${formatTime(elapsedTime)}`}
                    </p>

                    <div className="space-y-3">
                        {roundResults.map((result, idx) => {
                            const meta = ROUND_META[result.type];
                            if (!meta) return null;
                            return (
                                <div key={idx} className="flex items-center justify-between rounded-lg border border-gray-800 bg-[#161616] p-4">
                                    <span className={`font-bold ${meta.color}`}>{meta.label}</span>
                                    <span className="text-gray-300">Submitted ✓</span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4">
                        <div className="flex items-start gap-3 text-left">
                            <BarChart3 className="h-5 w-5 text-purple-400 mt-0.5 shrink-0" />
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-purple-400">Results Pending</p>
                                <p className="text-xs text-gray-400">
                                    Your score, the leaderboard, and the full question analysis will be available here after the
                                    assessment ends for everyone on {new Date(endTime).toLocaleString()}.
                                </p>
                            </div>
                        </div>
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
            {/* Warning Toast */}
            {showWarning && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-top-2">
                    <div className={`flex items-center gap-3 rounded-xl px-6 py-4 shadow-2xl border ${
                        warningCount >= 3
                            ? "bg-red-600 border-red-400 text-white"
                            : "bg-yellow-500/90 border-yellow-400 text-black"
                    }`}>
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                        <p className="font-bold text-sm">{warningMessage}</p>
                        {warningCount < 3 && (
                            <button onClick={() => setShowWarning(false)} className="ml-2">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Warning counter badge */}
            {warningCount > 0 && warningCount < 3 && (
                <div className="fixed top-16 right-4 z-[9998]">
                    <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
                        warningCount === 1 ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" :
                        "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}>
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Warnings: {warningCount}/3
                    </div>
                </div>
            )}

            {/* Camera preview */}
            {cameraStreamRef.current && (
                <div className="fixed bottom-4 right-4 z-[9998] rounded-xl overflow-hidden border-2 border-gray-700 shadow-2xl bg-black">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-40 h-30 object-cover"
                        style={{ transform: "scaleX(-1)" }}
                    />
                    <div className="absolute top-1 left-1 flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        <span className="text-[10px] font-bold text-white">LIVE</span>
                    </div>
                </div>
            )}

            {/* Submit confirmation modal */}
            {showSubmitConfirm && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="max-w-md w-full rounded-xl border border-gray-800 bg-[#161616] p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
                                <Send className="h-5 w-5 text-red-400" />
                            </div>
                            <h2 className="text-lg font-bold text-white">Submit Test?</h2>
                        </div>
                        <p className="text-sm text-gray-400">
                            This will end your assessment immediately and submit your progress so far.
                            {hasTimeLimit && (
                                <span className="block mt-1 text-gray-300">
                                    You still have <span className="font-mono font-bold text-white">{formatCountdown(remainingTime)}</span> remaining.
                                </span>
                            )}
                            {currentRoundIndex < rounds.length && (
                                <span className="block mt-1 text-yellow-400">
                                    Rounds you haven&apos;t finished will not receive any marks.
                                </span>
                            )}
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowSubmitConfirm(false)}
                                className="flex-1 rounded-lg bg-gray-800 py-2.5 font-bold text-white hover:bg-gray-700 border border-gray-700"
                            >
                                Continue Test
                            </button>
                            <button onClick={handleManualSubmit}
                                className="flex-1 rounded-lg bg-red-600 py-2.5 font-bold text-white hover:bg-red-500"
                            >
                                Submit Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 border border-green-500/30 px-3 py-1.5 text-xs">
                        <Shield className="h-3.5 w-3.5 text-green-400" />
                        <span className="text-green-400 font-bold">Proctored</span>
                    </div>
                    {hasTimeLimit ? (
                        <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm border transition-colors ${
                            remainingTime <= 60
                                ? "bg-red-500/20 border-red-500/40 text-red-300 animate-pulse"
                                : remainingTime <= 300
                                    ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-300"
                                    : "bg-gray-800 border-gray-700 text-gray-300"
                        }`}>
                            <Clock className={`h-4 w-4 ${
                                remainingTime <= 60 ? "text-red-400" : remainingTime <= 300 ? "text-yellow-400" : "text-purple-400"
                            }`} />
                            <span className="font-mono font-bold">{formatCountdown(remainingTime)}</span>
                            <span className="text-[10px] uppercase tracking-wider opacity-70">left</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 rounded-full bg-gray-800 px-3 py-1.5 text-sm text-gray-300">
                            <Clock className="h-4 w-4 text-purple-400" />
                            <span className="font-mono">{formatTime(elapsedTime)}</span>
                        </div>
                    )}
                    <button onClick={() => setShowSubmitConfirm(true)}
                        className="flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-500 transition-colors"
                    >
                        <Send className="h-3.5 w-3.5" /> Submit Test
                    </button>
                </div>
            </div>

            {/* Round content */}
            <div className="flex-1">
                {currentRound.type === "mcq" && (
                    <MCQPlayer
                        role={currentRound.role || "Software Development Engineer"}
                        level={currentRound.level || 5}
                        questionCount={currentRound.questionCount || 10}
                        adaptive={!!currentRound.adaptive}
                        onComplete={(result) => handleRoundComplete({ type: "mcq", ...result })}
                    />
                )}
                {currentRound.type === "coding" && (
                    <CodingPlayer
                        level={currentRound.level || 5}
                        problemCount={currentRound.problemCount || 3}
                        adaptive={!!currentRound.adaptive}
                        onComplete={(results) => handleRoundComplete({ type: "coding", ...results })}
                    />
                )}
                {currentRound.type === "voice" && (
                    <VoicePlayer
                        topic={currentRound.topic || "General"}
                        questionCount={currentRound.questionCount || 10}
                        level={currentRound.level || 5}
                        adaptive={!!currentRound.adaptive}
                        onComplete={(result) => handleRoundComplete({ type: "voice", ...result })}
                    />
                )}
                {currentRound.type === "debug" && (
                    <DebugPlayer
                        level={currentRound.level || 5}
                        challengeCount={currentRound.challengeCount || 3}
                        language={currentRound.language || "python"}
                        onComplete={(result) => handleRoundComplete({ type: "debug", ...result })}
                    />
                )}
                {currentRound.type === "output" && (
                    <OutputPlayer
                        level={currentRound.level || 5}
                        questionCount={currentRound.questionCount || 5}
                        onComplete={(result) => handleRoundComplete({ type: "output", ...result })}
                    />
                )}
                {currentRound.type === "sql" && (
                    <SQLPlayer
                        level={currentRound.level || 5}
                        questionCount={currentRound.questionCount || 3}
                        onComplete={(result) => handleRoundComplete({ type: "sql", ...result })}
                    />
                )}
                {currentRound.type === "email" && (
                    <EmailPlayer
                        level={currentRound.level || 5}
                        questionCount={currentRound.questionCount || 3}
                        onComplete={(result) => handleRoundComplete({ type: "email", ...result })}
                    />
                )}
            </div>
        </div>
    );
}
