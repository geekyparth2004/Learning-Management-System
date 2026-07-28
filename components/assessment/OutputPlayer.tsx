"use client";

import React, { useState, useEffect } from "react";
import { Terminal, Loader2, ChevronRight, CheckCircle2 } from "lucide-react";

interface OutputQuestion {
    language: string;
    code: string;
    expectedOutput: string;
    explanation?: string;
}

export interface OutputRoundResult {
    score: number;
    maxScore: number;
    correct: number;
    totalQuestions: number;
    questions: {
        language: string;
        code: string;
        expectedOutput: string;
        predicted: string;
        correct: boolean;
        explanation?: string;
    }[];
}

interface OutputPlayerProps {
    level: number;
    questionCount: number;
    onComplete: (result: OutputRoundResult) => void;
}

// Predictions are graded on normalized text so spacing quirks don't cost marks:
// CRLF -> LF, trailing whitespace stripped per line, outer blank lines trimmed.
function normalizeOutput(text: string): string {
    return (text || "")
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map(line => line.replace(/\s+$/, ""))
        .join("\n")
        .trim();
}

export default function OutputPlayer({ level, questionCount, onComplete }: OutputPlayerProps) {
    const [questions, setQuestions] = useState<OutputQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<string[]>([]);

    useEffect(() => {
        let cancelled = false;
        async function loadQuestions() {
            try {
                const res = await fetch("/api/assessment/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: "output", level, questionCount }),
                });
                const data = await res.json();
                if (cancelled) return;
                if (data.error) {
                    setError(data.error);
                } else {
                    const items: OutputQuestion[] = data.questions || [];
                    setQuestions(items);
                    setAnswers(new Array(items.length).fill(""));
                }
            } catch (err: any) {
                if (!cancelled) setError(err.message || "Failed to load questions");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        loadQuestions();
        return () => { cancelled = true; };
    }, [level, questionCount]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
                <p className="text-gray-400">AI is generating {questionCount} output-prediction questions at Level {level}...</p>
                <p className="text-xs text-gray-500">This may take 10-15 seconds</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
                <div className="text-center space-y-4 p-8">
                    <p className="text-red-400 text-lg">{error}</p>
                    <button onClick={() => window.location.reload()} className="rounded-lg bg-gray-800 px-6 py-2 text-white hover:bg-gray-700">Retry</button>
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
    const hasAnswer = (answers[currentIndex] || "").trim().length > 0;
    const isLast = currentIndex >= questions.length - 1;

    function setAnswer(value: string) {
        const next = [...answers];
        next[currentIndex] = value;
        setAnswers(next);
    }

    function nextQuestion() {
        if (!isLast) {
            setCurrentIndex(prev => prev + 1);
            return;
        }
        // +5 marks per correctly predicted output; correctness is never revealed during the round
        const graded = questions.map((q, idx) => {
            const predicted = answers[idx] || "";
            const correct = normalizeOutput(predicted) === normalizeOutput(q.expectedOutput);
            return {
                language: q.language || "code",
                code: q.code,
                expectedOutput: q.expectedOutput,
                predicted,
                correct,
                explanation: q.explanation,
            };
        });
        const correctCount = graded.filter(g => g.correct).length;
        onComplete({
            score: correctCount * 5,
            maxScore: questions.length * 5,
            correct: correctCount,
            totalQuestions: questions.length,
            questions: graded,
        });
    }

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            {/* Progress */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Terminal className="h-4 w-4 text-cyan-400" />
                    <span>Output Prediction Round — Level {level}</span>
                </div>
                <div className="text-sm font-mono text-gray-400">
                    {currentIndex + 1} / {questions.length}
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                    style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
            </div>

            {/* Question */}
            <div className="rounded-xl border border-gray-800 bg-[#161616] p-6 space-y-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">What does this code print?</h2>
                    <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 text-xs font-bold text-cyan-400 uppercase">
                        {current.language || "code"}
                    </span>
                </div>

                {/* Code snippet */}
                <pre className="rounded-lg border border-gray-800 bg-[#0b0b0b] p-4 overflow-x-auto text-sm leading-relaxed text-gray-200 font-mono whitespace-pre">
                    {current.code}
                </pre>

                {/* Answer box */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Your predicted output</label>
                    <textarea
                        value={answers[currentIndex] || ""}
                        onChange={e => setAnswer(e.target.value)}
                        rows={4}
                        spellCheck={false}
                        className="w-full rounded-lg border border-gray-800 bg-[#0b0b0b] px-4 py-3 font-mono text-sm text-white placeholder-gray-600 focus:border-cyan-500 focus:outline-none"
                        placeholder={"Type the exact output here...\nUse a new line for each printed line"}
                    />
                    <p className="text-xs text-gray-500">
                        Write the output exactly as the program would print it — one line per printed line. +5 marks if correct.
                    </p>
                </div>

                {/* Next button */}
                {hasAnswer && (
                    <div className="flex justify-end">
                        <button onClick={nextQuestion}
                            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-3 font-bold text-white hover:from-cyan-500 hover:to-blue-500 transition-all"
                        >
                            {!isLast ? (
                                <>Next Question <ChevronRight className="h-4 w-4" /></>
                            ) : (
                                <>Finish Output Round <CheckCircle2 className="h-4 w-4" /></>
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
