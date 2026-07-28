"use client";

import React, { useState, useEffect } from "react";
import { Mail, Loader2, ChevronRight, CheckCircle2, Sparkles, User } from "lucide-react";

interface EmailTask {
    topic: string;
    scenario: string;
}

export interface EmailRoundResult {
    score: number;
    maxScore: number;
    questions: {
        topic: string;
        scenario: string;
        email: string;
        marks: number;
        grammarIssues: number;
        feedback: string;
    }[];
}

interface EmailPlayerProps {
    level: number;
    questionCount: number;
    onComplete: (result: EmailRoundResult) => void;
}

const LEVEL_LABELS: Record<number, string> = {
    1: "Beginner", 2: "Beginner+", 3: "Elementary", 4: "Elementary+", 5: "Intermediate",
    6: "Intermediate+", 7: "Advanced", 8: "Advanced+", 9: "Expert", 10: "Master",
};

export default function EmailPlayer({ level, questionCount, onComplete }: EmailPlayerProps) {
    const [tasks, setTasks] = useState<EmailTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [draft, setDraft] = useState("");
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [evaluations, setEvaluations] = useState<EmailRoundResult["questions"]>([]);

    const difficulty = LEVEL_LABELS[level] || "Intermediate";

    useEffect(() => {
        let cancelled = false;
        async function loadTasks() {
            try {
                const res = await fetch("/api/assessment/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: "email", level, questionCount }),
                });
                const data = await res.json();
                if (cancelled) return;
                if (data.error) {
                    setError(data.error);
                } else {
                    setTasks(data.questions || []);
                }
            } catch (err: any) {
                if (!cancelled) setError(err.message || "Failed to load email tasks");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        loadTasks();
        return () => { cancelled = true; };
    }, [level, questionCount]);

    async function submitEmail() {
        const task = tasks[currentIndex];
        if (!task || !draft.trim()) return;

        setIsEvaluating(true);

        // AI grades the email out of 10 for grammar and professionalism; marks stay hidden
        let evaluation: EmailRoundResult["questions"][number] = {
            topic: task.topic,
            scenario: task.scenario,
            email: draft,
            marks: 0,
            grammarIssues: 0,
            feedback: "Your email could not be evaluated.",
        };
        try {
            const res = await fetch("/api/assessment/email-evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic: task.topic,
                    scenario: task.scenario,
                    email: draft,
                    difficulty,
                }),
            });
            const data = await res.json();
            if (!data.error) {
                evaluation = {
                    topic: task.topic,
                    scenario: task.scenario,
                    email: draft,
                    marks: typeof data.marks === "number" ? data.marks : 0,
                    grammarIssues: typeof data.grammarIssues === "number" ? data.grammarIssues : 0,
                    feedback: data.feedback || "",
                };
            }
        } catch (err) {
            console.error("Email evaluation failed", err);
        }

        const newEvaluations = [...evaluations, evaluation];
        setEvaluations(newEvaluations);
        setIsEvaluating(false);

        if (currentIndex < tasks.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setDraft("");
        } else {
            const score = newEvaluations.reduce((sum, e) => sum + e.marks, 0);
            onComplete({
                score,
                maxScore: tasks.length * 10,
                questions: newEvaluations,
            });
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
                <p className="text-gray-400">AI is preparing {questionCount} email-writing task{questionCount === 1 ? "" : "s"} at Level {level}...</p>
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

    if (tasks.length === 0) {
        return (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
                <p className="text-gray-400">No email tasks generated.</p>
            </div>
        );
    }

    const current = tasks[currentIndex];
    const isLast = currentIndex >= tasks.length - 1;
    const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;

    if (isEvaluating) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 min-h-[60vh]">
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-amber-500/20">
                    <Sparkles className="h-10 w-10 animate-pulse text-amber-400" />
                    <div className="absolute inset-0 animate-ping rounded-full bg-amber-500/20" />
                </div>
                <p className="text-amber-400 font-medium">AI is reviewing your email...</p>
                <p className="text-xs text-gray-500">Checking grammar and professionalism — marks revealed after the assessment ends</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-3.5rem)]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Mail className="h-4 w-4 text-amber-400" />
                    <span>Email Writing Round — Level {level} ({difficulty})</span>
                </div>
                <div className="text-sm font-mono text-gray-400">
                    {currentIndex + 1} / {tasks.length}
                </div>
            </div>

            {/* Split view: scenario left, editor right */}
            <div className="flex flex-1 min-h-0">
                {/* Left: the task */}
                <div className="w-1/2 border-r border-gray-800 overflow-y-auto p-6 space-y-4">
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-1">
                        <p className="text-[10px] uppercase tracking-wider text-amber-400/70 font-bold">Topic</p>
                        <h2 className="text-xl font-bold text-white">{current.topic}</h2>
                    </div>

                    <div className="rounded-lg border border-gray-800 bg-[#111111] p-4 space-y-2">
                        <p className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                            <User className="h-3.5 w-3.5" /> Scenario
                        </p>
                        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{current.scenario}</p>
                    </div>

                    <div className="rounded-lg border border-gray-800 bg-[#111111] p-4 space-y-2 text-xs text-gray-400">
                        <p className="font-bold text-gray-300">Marking (out of 10)</p>
                        <ul className="space-y-1 list-disc list-inside">
                            <li>Grammar, spelling and punctuation</li>
                            <li>Professional tone — no slang, appropriate formality</li>
                            <li>Email structure — greeting, clear body, sign-off</li>
                            <li>Actually addresses the scenario and its goal</li>
                        </ul>
                        <p className="text-gray-500">AI deducts marks for each issue it finds. Marks are revealed after the assessment ends.</p>
                    </div>
                </div>

                {/* Right: compose box */}
                <div className="w-1/2 flex flex-col">
                    <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
                        <span className="text-sm text-gray-400">Compose your email</span>
                        <span className="text-xs text-gray-500 font-mono">{wordCount} words</span>
                    </div>
                    <textarea
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        spellCheck={false}
                        className="flex-1 min-h-0 w-full resize-none bg-[#0b0b0b] p-4 text-sm text-gray-200 leading-relaxed placeholder-gray-600 focus:outline-none"
                        placeholder={"Subject: ...\n\nDear ...,\n\nWrite your email here.\n\nRegards,\nYour Name"}
                    />
                    <div className="flex items-center justify-end border-t border-gray-800 px-4 py-3">
                        <button onClick={submitEmail} disabled={!draft.trim()}
                            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-2.5 font-bold text-white hover:from-amber-500 hover:to-orange-500 disabled:opacity-40 transition-all"
                        >
                            {isLast ? (
                                <>Submit & Finish Email Round <CheckCircle2 className="h-4 w-4" /></>
                            ) : (
                                <>Submit & Next Email <ChevronRight className="h-4 w-4" /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
