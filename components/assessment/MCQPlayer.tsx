"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckSquare, Loader2, ChevronRight, CheckCircle2, TrendingUp, Brain } from "lucide-react";
import { nextLevel, levelLabel } from "@/lib/adaptive";

interface MCQQuestion {
    question: string;
    options: string[];
    correctIndex: number;
}

// The aptitude round is the same player with a different question source and accent.
type MCQVariant = "mcq" | "aptitude";

const VARIANT_META: Record<MCQVariant, {
    icon: any;
    accentText: string;
    badge: string;
    levelTag: string;
    barGradient: string;
    selectedOption: string;
    selectedBadge: string;
    nextButton: string;
    spinner: string;
}> = {
    mcq: {
        icon: CheckSquare,
        accentText: "text-pink-400",
        badge: "border-pink-500/30 bg-pink-500/10 text-pink-400",
        levelTag: "text-pink-400/70",
        barGradient: "from-pink-500 to-purple-500",
        selectedOption: "border-pink-500 bg-pink-500/10 text-white",
        selectedBadge: "bg-pink-500 text-white",
        nextButton: "bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500",
        spinner: "text-pink-400",
    },
    aptitude: {
        icon: Brain,
        accentText: "text-teal-400",
        badge: "border-teal-500/30 bg-teal-500/10 text-teal-400",
        levelTag: "text-teal-400/70",
        barGradient: "from-teal-500 to-emerald-500",
        selectedOption: "border-teal-500 bg-teal-500/10 text-white",
        selectedBadge: "bg-teal-500 text-white",
        nextButton: "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500",
        spinner: "text-teal-400",
    },
};

export interface MCQRoundResult {
    score: number;
    maxScore: number;
    correct: number;
    totalQuestions: number;
    adaptive: boolean;
    highestLevel?: number;
    finalLevel?: number;
    questions: {
        question: string;
        options: string[];
        correctIndex: number;
        selectedIndex: number | null;
        level?: number;
    }[];
}

interface MCQPlayerProps {
    role: string;
    level: number;
    questionCount: number;
    adaptive?: boolean;
    variant?: MCQVariant;
    onComplete: (result: MCQRoundResult) => void;
}

export default function MCQPlayer({ role, level, questionCount, adaptive = false, variant = "mcq", onComplete }: MCQPlayerProps) {
    const meta = VARIANT_META[variant];
    const roundLabel = variant === "aptitude" ? "Aptitude Round" : `MCQ Round — ${role}`;
    const [questions, setQuestions] = useState<MCQQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);

    // Adaptive state: the round starts at level 1 and moves with the student's accuracy.
    const [currentLevel, setCurrentLevel] = useState(1);
    const questionLevelsRef = useRef<number[]>([]);
    const highestLevelRef = useRef(1);
    const askedRef = useRef<string[]>([]);

    const fetchAdaptiveQuestion = useCallback(async (atLevel: number) => {
        const res = await fetch("/api/assessment/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: variant,
                role,
                level: atLevel,
                questionCount: 1,
                exclude: askedRef.current,
            }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        const question = (data.questions || [])[0];
        if (!question) throw new Error("Failed to generate the next question");
        return question as MCQQuestion;
    }, [role, variant]);

    // Initial load: adaptive fetches only the first question (at level 1), fixed fetches the whole set.
    useEffect(() => {
        let cancelled = false;
        async function loadQuestions() {
            try {
                if (adaptive) {
                    const question = await fetchAdaptiveQuestion(1);
                    if (cancelled) return;
                    askedRef.current = [question.question];
                    questionLevelsRef.current = [1];
                    setQuestions([question]);
                    setSelectedAnswers([null]);
                } else {
                    const res = await fetch("/api/assessment/generate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ type: variant, role, level, questionCount }),
                    });
                    const data = await res.json();
                    if (cancelled) return;
                    if (data.error) {
                        setError(data.error);
                    } else {
                        setQuestions(data.questions || []);
                        setSelectedAnswers(new Array(data.questions?.length || 0).fill(null));
                    }
                }
            } catch (err: any) {
                if (!cancelled) setError(err.message || "Failed to load questions");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        loadQuestions();
        return () => { cancelled = true; };
    }, [role, level, questionCount, adaptive, variant, fetchAdaptiveQuestion]);

    function buildResult(finalQuestions: MCQQuestion[], finalAnswers: (number | null)[]): MCQRoundResult {
        const correct = finalAnswers.filter((ans, idx) => ans === finalQuestions[idx]?.correctIndex).length;
        return {
            score: correct,
            // Adaptive rounds are scored against the configured target so students stay
            // comparable; fixed rounds against however many questions the AI produced.
            maxScore: adaptive ? questionCount : finalQuestions.length,
            correct,
            totalQuestions: finalQuestions.length,
            adaptive,
            ...(adaptive ? { highestLevel: highestLevelRef.current, finalLevel: currentLevel } : {}),
            questions: finalQuestions.map((q, idx) => ({
                question: q.question,
                options: q.options,
                correctIndex: q.correctIndex,
                selectedIndex: finalAnswers[idx] ?? null,
                ...(adaptive ? { level: questionLevelsRef.current[idx] } : {}),
            })),
        };
    }

    function selectOption(optIndex: number) {
        const newAnswers = [...selectedAnswers];
        newAnswers[currentIndex] = optIndex;
        setSelectedAnswers(newAnswers);
    }

    async function nextQuestion() {
        if (!adaptive) {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                onComplete(buildResult(questions, selectedAnswers));
            }
            return;
        }

        // Adaptive: grade this answer silently, move the level, then fetch the next question.
        const wasCorrect = selectedAnswers[currentIndex] === questions[currentIndex]?.correctIndex;
        const answeredCount = currentIndex + 1;

        if (answeredCount >= questionCount) {
            onComplete(buildResult(questions, selectedAnswers));
            return;
        }

        const upcomingLevel = nextLevel(currentLevel, wasCorrect);
        setCurrentLevel(upcomingLevel);
        if (upcomingLevel > highestLevelRef.current) highestLevelRef.current = upcomingLevel;

        setLoading(true);
        try {
            const question = await fetchAdaptiveQuestion(upcomingLevel);
            askedRef.current = [...askedRef.current, question.question];
            questionLevelsRef.current = [...questionLevelsRef.current, upcomingLevel];
            setQuestions(prev => [...prev, question]);
            setSelectedAnswers(prev => [...prev, null]);
            setCurrentIndex(prev => prev + 1);
        } catch {
            // Generation failed — end the round with what the student has answered so far
            // rather than trapping them on a dead screen.
            onComplete(buildResult(questions, selectedAnswers));
            return;
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4">
                <Loader2 className={`h-10 w-10 animate-spin ${meta.spinner}`} />
                {adaptive ? (
                    <>
                        <p className="text-gray-400">
                            AI is preparing your next question at <span className={`${meta.accentText} font-bold`}>Level {currentLevel}</span>...
                        </p>
                        <p className="text-xs text-gray-500">Adaptive mode — difficulty follows your answers</p>
                    </>
                ) : (
                    <>
                        <p className="text-gray-400">
                            {variant === "aptitude"
                                ? <>AI is generating {questionCount} <span className={`${meta.accentText} font-bold`}>aptitude</span> questions...</>
                                : <>AI is generating {questionCount} MCQ questions for <span className={`${meta.accentText} font-bold`}>{role}</span>...</>}
                        </p>
                        <p className="text-xs text-gray-500">This may take 10-15 seconds</p>
                    </>
                )}
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
                <div className="text-center space-y-4 p-8">
                    <p className="text-red-400 text-lg">{error}</p>
                    <button onClick={() => window.location.reload()} className="rounded-lg bg-gray-800 px-6 py-2 text-white hover:bg-gray-700">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
                <p className="text-gray-400">No questions generated. Please try again.</p>
            </div>
        );
    }

    const current = questions[currentIndex];
    const hasSelected = selectedAnswers[currentIndex] !== null && selectedAnswers[currentIndex] !== undefined;
    const totalToAsk = adaptive ? questionCount : questions.length;
    const isLastQuestion = currentIndex + 1 >= totalToAsk;

    const optionLabels = ["A", "B", "C", "D"];
    const HeaderIcon = meta.icon;

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            {/* Progress */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <HeaderIcon className={`h-4 w-4 ${meta.accentText}`} />
                    <span>{roundLabel}</span>
                    {adaptive && (
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.badge}`}>
                            <TrendingUp className="h-3 w-3" /> ADAPTIVE
                        </span>
                    )}
                </div>
                <div className="text-sm font-mono text-gray-400">
                    {currentIndex + 1} / {totalToAsk}
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
                <div
                    className={`h-full rounded-full bg-gradient-to-r ${meta.barGradient} transition-all duration-500`}
                    style={{ width: `${((currentIndex + 1) / totalToAsk) * 100}%` }}
                />
            </div>

            {/* Question */}
            <div className="rounded-xl border border-gray-800 bg-[#161616] p-6">
                {adaptive && (
                    <p className={`mb-3 text-xs font-bold uppercase tracking-wider ${meta.levelTag}`}>
                        Level {currentLevel} · {levelLabel(currentLevel)}
                    </p>
                )}
                <h2 className="text-xl font-bold leading-relaxed mb-6">
                    {current.question}
                </h2>

                {/* Options — no correct/wrong feedback during the assessment */}
                <div className="space-y-3">
                    {current.options.map((option, optIdx) => {
                        const isSelected = selectedAnswers[currentIndex] === optIdx;
                        return (
                            <button
                                key={optIdx}
                                onClick={() => selectOption(optIdx)}
                                className={`w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all cursor-pointer ${
                                    isSelected
                                        ? meta.selectedOption
                                        : "border-gray-800 bg-[#111111] text-gray-300 hover:border-gray-600 hover:bg-[#1a1a1a]"
                                }`}
                            >
                                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-sm ${
                                    isSelected ? meta.selectedBadge : "bg-gray-800 text-gray-400"
                                }`}>
                                    {optionLabels[optIdx]}
                                </span>
                                <span className="flex-1">{option}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Next button */}
                {hasSelected && (
                    <div className="mt-6 flex justify-end">
                        <button onClick={nextQuestion}
                            className={`flex items-center gap-2 rounded-xl px-6 py-3 font-bold text-white transition-all ${meta.nextButton}`}
                        >
                            {!isLastQuestion ? (
                                <>Next Question <ChevronRight className="h-4 w-4" /></>
                            ) : (
                                <>Finish {variant === "aptitude" ? "Aptitude" : "MCQ"} Round <CheckCircle2 className="h-4 w-4" /></>
                            )}
                        </button>
                    </div>
                )}
            </div>

            <div className="text-center text-sm text-gray-500">
                Answers are evaluated after the assessment ends for everyone.
            </div>
        </div>
    );
}
