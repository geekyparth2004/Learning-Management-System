"use client";

import React, { useState, useEffect } from "react";
import { CheckSquare, Loader2, ChevronRight, CheckCircle2 } from "lucide-react";

interface MCQQuestion {
    question: string;
    options: string[];
    correctIndex: number;
}

interface MCQPlayerProps {
    role: string;
    level: number;
    questionCount: number;
    onComplete: (score: number) => void;
}

export default function MCQPlayer({ role, level, questionCount, onComplete }: MCQPlayerProps) {
    const [questions, setQuestions] = useState<MCQQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);
    const [isAnswered, setIsAnswered] = useState(false);
    const [showResult, setShowResult] = useState(false);

    // Fetch questions on mount
    useEffect(() => {
        async function loadQuestions() {
            try {
                const res = await fetch("/api/assessment/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: "mcq", role, level, questionCount }),
                });
                const data = await res.json();
                if (data.error) {
                    setError(data.error);
                } else {
                    setQuestions(data.questions || []);
                    setSelectedAnswers(new Array(data.questions?.length || 0).fill(null));
                }
            } catch (err: any) {
                setError(err.message || "Failed to load questions");
            } finally {
                setLoading(false);
            }
        }
        loadQuestions();
    }, [role, level, questionCount]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-pink-400" />
                <p className="text-gray-400">AI is generating {questionCount} MCQ questions for <span className="text-pink-400 font-bold">{role}</span>...</p>
                <p className="text-xs text-gray-500">This may take 10-15 seconds</p>
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
    const totalCorrect = selectedAnswers.filter((ans, idx) => ans === questions[idx]?.correctIndex).length;

    function selectOption(optIndex: number) {
        if (isAnswered) return;
        const newAnswers = [...selectedAnswers];
        newAnswers[currentIndex] = optIndex;
        setSelectedAnswers(newAnswers);
        setIsAnswered(true);
    }

    function nextQuestion() {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsAnswered(false);
        } else {
            // Calculate final score
            const score = selectedAnswers.filter((ans, idx) => ans === questions[idx]?.correctIndex).length;
            const percentage = Math.round((score / questions.length) * 100);
            onComplete(percentage);
        }
    }

    const optionLabels = ["A", "B", "C", "D"];

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            {/* Progress */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <CheckSquare className="h-4 w-4 text-pink-400" />
                    <span>MCQ Round — {role}</span>
                </div>
                <div className="text-sm font-mono text-gray-400">
                    {currentIndex + 1} / {questions.length}
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
            </div>

            {/* Question */}
            <div className="rounded-xl border border-gray-800 bg-[#161616] p-6">
                <h2 className="text-xl font-bold leading-relaxed mb-6">
                    {current.question}
                </h2>

                {/* Options */}
                <div className="space-y-3">
                    {current.options.map((option, optIdx) => {
                        const isSelected = selectedAnswers[currentIndex] === optIdx;
                        const isCorrect = optIdx === current.correctIndex;
                        const showCorrect = isAnswered && isCorrect;
                        const showWrong = isAnswered && isSelected && !isCorrect;

                        return (
                            <button
                                key={optIdx}
                                onClick={() => selectOption(optIdx)}
                                disabled={isAnswered}
                                className={`w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                                    showCorrect
                                        ? "border-green-500 bg-green-500/10 text-green-300"
                                        : showWrong
                                            ? "border-red-500 bg-red-500/10 text-red-300"
                                            : isSelected
                                                ? "border-pink-500 bg-pink-500/10 text-white"
                                                : "border-gray-800 bg-[#111111] text-gray-300 hover:border-gray-600 hover:bg-[#1a1a1a]"
                                } ${isAnswered ? "cursor-default" : "cursor-pointer"}`}
                            >
                                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-sm ${
                                    showCorrect ? "bg-green-500 text-white" :
                                    showWrong ? "bg-red-500 text-white" :
                                    isSelected ? "bg-pink-500 text-white" :
                                    "bg-gray-800 text-gray-400"
                                }`}>
                                    {showCorrect ? "✓" : showWrong ? "✗" : optionLabels[optIdx]}
                                </span>
                                <span className="flex-1">{option}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Next button */}
                {isAnswered && (
                    <div className="mt-6 flex justify-end">
                        <button onClick={nextQuestion}
                            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-3 font-bold text-white hover:from-pink-500 hover:to-purple-500 transition-all"
                        >
                            {currentIndex < questions.length - 1 ? (
                                <>Next Question <ChevronRight className="h-4 w-4" /></>
                            ) : (
                                <>Finish MCQ Round <CheckCircle2 className="h-4 w-4" /></>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Score tracker */}
            <div className="text-center text-sm text-gray-500">
                Score: <span className="text-green-400 font-bold">{totalCorrect}</span> / {currentIndex + (isAnswered ? 1 : 0)}
            </div>
        </div>
    );
}
