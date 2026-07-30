"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Trophy, CheckCircle2, XCircle, ArrowLeft, Medal, BarChart3, Sparkles, TrendingUp, Bug, Database } from "lucide-react";
import { levelLabel } from "@/lib/adaptive";
import { ROUND_META } from "./round-meta";

interface LeaderboardEntry {
    rank: number;
    userId: string;
    name: string;
    score: number;
    completed: boolean;
}

interface AssessmentResultsProps {
    title: string;
    endTime: string;
    currentUserId: string;
    leaderboard: LeaderboardEntry[];
    myScore: number | null;
    myResults: any;
}

const optionLabels = ["A", "B", "C", "D"];

export default function AssessmentResults({ title, endTime, currentUserId, leaderboard, myScore, myResults }: AssessmentResultsProps) {
    const [activeTab, setActiveTab] = useState<"leaderboard" | "analysis">("leaderboard");

    const myRank = leaderboard.find(e => e.userId === currentUserId)?.rank ?? null;
    const rounds: any[] = myResults?.rounds || [];

    const medalColor = (rank: number) =>
        rank === 1 ? "text-yellow-400" : rank === 2 ? "text-gray-300" : rank === 3 ? "text-amber-600" : "text-gray-500";

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
            <Link href="/assessment" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white">
                <ArrowLeft className="h-4 w-4" /> Back to Assessments
            </Link>

            {/* Header */}
            <div className="text-center space-y-3">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
                    {title}
                </h1>
                <p className="text-sm text-gray-500">Ended {new Date(endTime).toLocaleString()}</p>
                {myScore !== null && (
                    <div className="inline-flex items-center gap-4 rounded-xl border border-purple-500/30 bg-purple-500/5 px-6 py-3">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-white">{myScore}</p>
                            <p className="text-[10px] uppercase tracking-wider text-gray-500">Your Score</p>
                        </div>
                        {myRank !== null && (
                            <>
                                <div className="h-8 w-px bg-gray-800" />
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-white">#{myRank}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-gray-500">Your Rank</p>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex items-center justify-center gap-2">
                <button onClick={() => setActiveTab("leaderboard")}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                        activeTab === "leaderboard" ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
                    }`}
                >
                    <Trophy className="h-4 w-4" /> Leaderboard
                </button>
                <button onClick={() => setActiveTab("analysis")}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                        activeTab === "analysis" ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
                    }`}
                >
                    <BarChart3 className="h-4 w-4" /> Question Analysis
                </button>
            </div>

            {/* ── Leaderboard ── */}
            {activeTab === "leaderboard" && (
                <div className="rounded-xl border border-gray-800 bg-[#161616] overflow-hidden">
                    {leaderboard.length === 0 ? (
                        <p className="p-8 text-center text-gray-500 italic">No one participated in this assessment.</p>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#1a1a1a] text-xs uppercase text-gray-400 border-b border-gray-800">
                                <tr>
                                    <th className="px-4 py-3 w-16">Rank</th>
                                    <th className="px-4 py-3">Student</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {leaderboard.map((entry) => {
                                    const isMe = entry.userId === currentUserId;
                                    return (
                                        <tr key={entry.userId} className={isMe ? "bg-purple-500/10" : "hover:bg-gray-800/50"}>
                                            <td className="px-4 py-3">
                                                <span className={`flex items-center gap-1 font-bold ${medalColor(entry.rank)}`}>
                                                    {entry.rank <= 3 ? <Medal className="h-4 w-4" /> : null}
                                                    #{entry.rank}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-white">
                                                {entry.name}
                                                {isMe && <span className="ml-2 rounded-full bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 text-[10px] font-bold text-purple-400">You</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                {entry.completed ? (
                                                    <span className="rounded bg-green-900/30 text-green-400 px-2 py-0.5 text-xs font-bold border border-green-900">Submitted</span>
                                                ) : (
                                                    <span className="rounded bg-gray-800 text-gray-400 px-2 py-0.5 text-xs font-bold">Did Not Submit</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-green-400">{entry.score}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* ── Question Analysis ── */}
            {activeTab === "analysis" && (
                <div className="space-y-6">
                    {rounds.length === 0 ? (
                        <div className="rounded-xl border border-gray-800 bg-[#161616] p-8 text-center text-gray-500 italic">
                            {myScore === null
                                ? "You did not attempt this assessment."
                                : "No detailed results are available for your submission."}
                        </div>
                    ) : (
                        rounds.map((round: any, roundIdx: number) => {
                            const meta = ROUND_META[round.type];
                            if (!meta) return null;
                            const Icon = meta.icon;
                            return (
                                <div key={roundIdx} className={`rounded-xl border p-5 space-y-4 ${meta.bg}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Icon className={`h-5 w-5 ${meta.color}`} />
                                            <h2 className={`font-bold ${meta.color}`}>{meta.label}</h2>
                                            {round.adaptive && (
                                                <span className={`inline-flex items-center gap-1 rounded-full border border-current/30 bg-black/30 px-2 py-0.5 text-[10px] font-bold ${meta.color}`}>
                                                    <TrendingUp className="h-3 w-3" /> ADAPTIVE
                                                </span>
                                            )}
                                        </div>
                                        <span className="rounded-full bg-black/30 px-3 py-1 text-sm font-bold text-white">
                                            {round.score ?? 0} / {round.maxScore ?? "—"} marks
                                        </span>
                                    </div>

                                    {/* Adaptive summary: how far up the difficulty ladder the student got */}
                                    {round.adaptive && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="rounded-lg border border-gray-800 bg-black/30 p-3 text-center">
                                                <p className="text-2xl font-bold text-white">
                                                    {round.highestLevel ?? 1}<span className="text-sm text-gray-500">/10</span>
                                                </p>
                                                <p className="text-[10px] uppercase tracking-wider text-gray-500">
                                                    Highest Level Achieved · {levelLabel(round.highestLevel ?? 1)}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-gray-800 bg-black/30 p-3 text-center">
                                                <p className="text-2xl font-bold text-white">
                                                    {round.finalLevel ?? 1}<span className="text-sm text-gray-500">/10</span>
                                                </p>
                                                <p className="text-[10px] uppercase tracking-wider text-gray-500">
                                                    Final Level · {levelLabel(round.finalLevel ?? 1)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* MCQ / Aptitude analysis (same question format, +1 per correct) */}
                                    {(round.type === "mcq" || round.type === "aptitude") && Array.isArray(round.questions) && (
                                        <div className="space-y-4">
                                            {round.questions.map((q: any, qIdx: number) => {
                                                const isCorrect = q.selectedIndex === q.correctIndex;
                                                return (
                                                    <div key={qIdx} className="rounded-lg border border-gray-800 bg-[#111111] p-4 space-y-3">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <p className="font-medium text-white text-sm">
                                                                <span className="text-gray-500 mr-2">Q{qIdx + 1}.</span>
                                                                {q.question}
                                                            </p>
                                                            <div className="shrink-0 flex items-center gap-2">
                                                                {q.level !== undefined && (
                                                                    <span className="rounded bg-gray-800 px-2 py-0.5 text-[10px] font-bold text-gray-400">L{q.level}</span>
                                                                )}
                                                                {isCorrect ? (
                                                                    <span className="flex items-center gap-1 text-xs font-bold text-green-400"><CheckCircle2 className="h-4 w-4" /> +1</span>
                                                                ) : (
                                                                    <span className="flex items-center gap-1 text-xs font-bold text-red-400"><XCircle className="h-4 w-4" /> 0</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            {(q.options || []).map((opt: string, optIdx: number) => {
                                                                const isAnswer = optIdx === q.correctIndex;
                                                                const isPicked = optIdx === q.selectedIndex;
                                                                return (
                                                                    <div key={optIdx} className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                                                                        isAnswer
                                                                            ? "border-green-500/50 bg-green-500/10 text-green-300"
                                                                            : isPicked
                                                                                ? "border-red-500/50 bg-red-500/10 text-red-300"
                                                                                : "border-gray-800 text-gray-400"
                                                                    }`}>
                                                                        <span className="font-bold text-xs">{optionLabels[optIdx]}</span>
                                                                        <span className="flex-1">{opt}</span>
                                                                        {isAnswer && <span className="text-[10px] font-bold text-green-400">CORRECT</span>}
                                                                        {isPicked && !isAnswer && <span className="text-[10px] font-bold text-red-400">YOUR ANSWER</span>}
                                                                        {isPicked && isAnswer && <span className="text-[10px] font-bold text-green-400">YOUR ANSWER</span>}
                                                                    </div>
                                                                );
                                                            })}
                                                            {q.selectedIndex === null && (
                                                                <p className="text-xs text-yellow-400 italic">Not answered</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Coding analysis */}
                                    {round.type === "coding" && Array.isArray(round.problems) && (
                                        <div className="space-y-3">
                                            {round.problems.map((p: any, pIdx: number) => (
                                                <div key={pIdx} className="rounded-lg border border-gray-800 bg-[#111111] p-4 space-y-2">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <p className="font-medium text-white text-sm flex items-center gap-2">
                                                            {p.level !== undefined && (
                                                                <span className="rounded bg-gray-800 px-2 py-0.5 text-[10px] font-bold text-gray-400">L{p.level}</span>
                                                            )}
                                                            {p.title || `Problem ${pIdx + 1}`}
                                                        </p>
                                                        <span className={`shrink-0 text-xs font-bold ${p.passedCount === p.testCaseCount && p.testCaseCount > 0 ? "text-green-400" : "text-yellow-400"}`}>
                                                            {p.passedCount}/{p.testCaseCount} test cases • +{(p.passedCount || 0) * 5} marks
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {Array.from({ length: p.testCaseCount || 0 }, (_, tcIdx) => {
                                                            const result = p.testResults?.[tcIdx];
                                                            const passed = !!result?.passed;
                                                            return (
                                                                <span key={tcIdx} className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold border ${
                                                                    passed
                                                                        ? "bg-green-500/10 text-green-400 border-green-500/30"
                                                                        : "bg-red-500/10 text-red-400 border-red-500/30"
                                                                }`}>
                                                                    {passed ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                                                    TC {tcIdx + 1}
                                                                </span>
                                                            );
                                                        })}
                                                        {(!p.testCaseCount || p.testCaseCount === 0) && (
                                                            <span className="text-xs text-gray-500 italic">Not attempted</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Debug challenge analysis */}
                                    {round.type === "debug" && Array.isArray(round.challenges) && (
                                        <div className="space-y-3">
                                            {round.challenges.map((c: any, cIdx: number) => (
                                                <div key={cIdx} className="rounded-lg border border-gray-800 bg-[#111111] p-4 space-y-2">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <p className="font-medium text-white text-sm flex items-center gap-2">
                                                            <Bug className="h-4 w-4 text-orange-400 shrink-0" />
                                                            {c.title || `Challenge ${cIdx + 1}`}
                                                        </p>
                                                        {c.passed ? (
                                                            <span className="shrink-0 flex items-center gap-1 text-xs font-bold text-green-400">
                                                                <CheckCircle2 className="h-4 w-4" /> Fixed • +5 marks
                                                            </span>
                                                        ) : (
                                                            <span className="shrink-0 flex items-center gap-1 text-xs font-bold text-red-400">
                                                                <XCircle className="h-4 w-4" /> Not fixed • 0 marks
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {Array.from({ length: c.testCaseCount || 0 }, (_, tcIdx) => {
                                                            const result = c.testResults?.[tcIdx];
                                                            const passed = !!result?.passed;
                                                            return (
                                                                <span key={tcIdx} className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold border ${
                                                                    passed
                                                                        ? "bg-green-500/10 text-green-400 border-green-500/30"
                                                                        : "bg-red-500/10 text-red-400 border-red-500/30"
                                                                }`}>
                                                                    {passed ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                                                    TC {tcIdx + 1}
                                                                </span>
                                                            );
                                                        })}
                                                        {(!c.testCaseCount || c.testResults?.length === 0) && (
                                                            <span className="text-xs text-gray-500 italic">Not attempted</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Output prediction analysis */}
                                    {round.type === "output" && Array.isArray(round.questions) && (
                                        <div className="space-y-3">
                                            {round.questions.map((q: any, qIdx: number) => (
                                                <div key={qIdx} className="rounded-lg border border-gray-800 bg-[#111111] p-4 space-y-3">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <p className="font-medium text-white text-sm">
                                                            <span className="text-gray-500 mr-2">Q{qIdx + 1}.</span>
                                                            What does this {q.language || "code"} print?
                                                        </p>
                                                        {q.correct ? (
                                                            <span className="shrink-0 flex items-center gap-1 text-xs font-bold text-green-400"><CheckCircle2 className="h-4 w-4" /> +5</span>
                                                        ) : (
                                                            <span className="shrink-0 flex items-center gap-1 text-xs font-bold text-red-400"><XCircle className="h-4 w-4" /> 0</span>
                                                        )}
                                                    </div>
                                                    <pre className="rounded-lg border border-gray-800 bg-[#0b0b0b] p-3 overflow-x-auto text-xs leading-relaxed text-gray-200 font-mono whitespace-pre">
                                                        {q.code}
                                                    </pre>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                                        <div className={`rounded-lg border p-2 ${q.correct ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
                                                            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Your Answer</p>
                                                            <pre className={`font-mono whitespace-pre-wrap ${q.correct ? "text-green-300" : "text-red-300"}`}>{q.predicted || "(empty)"}</pre>
                                                        </div>
                                                        <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-2">
                                                            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Correct Output</p>
                                                            <pre className="font-mono whitespace-pre-wrap text-green-300">{q.expectedOutput}</pre>
                                                        </div>
                                                    </div>
                                                    {q.explanation && (
                                                        <p className="flex items-start gap-2 text-xs text-cyan-300">
                                                            <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                                            {q.explanation}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* SQL analysis */}
                                    {round.type === "sql" && Array.isArray(round.questions) && (
                                        <div className="space-y-3">
                                            {round.questions.map((q: any, qIdx: number) => (
                                                <div key={qIdx} className="rounded-lg border border-gray-800 bg-[#111111] p-4 space-y-2">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <p className="font-medium text-white text-sm flex items-center gap-2">
                                                            <Database className="h-4 w-4 text-violet-400 shrink-0" />
                                                            {q.title || `Question ${qIdx + 1}`}
                                                        </p>
                                                        <span className={`shrink-0 text-xs font-bold ${q.passedCount === q.testCaseCount && q.testCaseCount > 0 ? "text-green-400" : "text-yellow-400"}`}>
                                                            {q.passedCount}/{q.testCaseCount} test cases • +{(q.passedCount || 0) * 3} marks
                                                        </span>
                                                    </div>
                                                    {q.finalQuery && q.finalQuery.trim() && (
                                                        <pre className="rounded-lg border border-gray-800 bg-[#0b0b0b] p-3 overflow-x-auto text-xs leading-relaxed text-violet-200 font-mono whitespace-pre-wrap">
                                                            {q.finalQuery}
                                                        </pre>
                                                    )}
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {Array.from({ length: q.testCaseCount || 0 }, (_, tcIdx) => {
                                                            const result = q.testResults?.[tcIdx];
                                                            const passed = !!result?.passed;
                                                            return (
                                                                <span key={tcIdx} className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold border ${
                                                                    passed
                                                                        ? "bg-green-500/10 text-green-400 border-green-500/30"
                                                                        : "bg-red-500/10 text-red-400 border-red-500/30"
                                                                }`}>
                                                                    {passed ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                                                    TC {tcIdx + 1}
                                                                </span>
                                                            );
                                                        })}
                                                        {(!q.testResults || q.testResults.length === 0) && (
                                                            <span className="text-xs text-gray-500 italic">Not attempted</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Email writing analysis */}
                                    {round.type === "email" && Array.isArray(round.questions) && (
                                        <div className="space-y-3">
                                            {round.questions.map((q: any, qIdx: number) => (
                                                <div key={qIdx} className="rounded-lg border border-gray-800 bg-[#111111] p-4 space-y-3">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <p className="font-medium text-white text-sm">
                                                            <span className="text-gray-500 mr-2">Email {qIdx + 1}.</span>
                                                            {q.topic}
                                                        </p>
                                                        <span className={`shrink-0 text-xs font-bold ${q.marks >= 7 ? "text-green-400" : q.marks >= 4 ? "text-yellow-400" : "text-red-400"}`}>
                                                            {q.marks}/10 marks
                                                        </span>
                                                    </div>
                                                    {q.scenario && (
                                                        <p className="text-xs text-gray-500 italic">{q.scenario}</p>
                                                    )}
                                                    <pre className="rounded-lg border border-gray-800 bg-[#0b0b0b] p-3 overflow-x-auto text-xs leading-relaxed text-gray-200 font-sans whitespace-pre-wrap max-h-64 overflow-y-auto">
                                                        {q.email || "(empty)"}
                                                    </pre>
                                                    <div className="flex items-center gap-3 text-xs">
                                                        {typeof q.grammarIssues === "number" && (
                                                            <span className={`rounded px-2 py-0.5 font-bold ${q.grammarIssues === 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                                                                {q.grammarIssues === 0 ? "No grammar issues" : `${q.grammarIssues} grammar issue${q.grammarIssues === 1 ? "" : "s"}`}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {q.feedback && (
                                                        <p className="flex items-start gap-2 text-xs text-amber-300">
                                                            <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                                            {q.feedback}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Voice analysis */}
                                    {round.type === "voice" && Array.isArray(round.questions) && (
                                        <div className="space-y-3">
                                            {round.questions.map((q: any, qIdx: number) => (
                                                <div key={qIdx} className="rounded-lg border border-gray-800 bg-[#111111] p-4 space-y-2">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <p className="font-medium text-white text-sm">
                                                            <span className="text-gray-500 mr-2">Q{qIdx + 1}.</span>
                                                            {q.question}
                                                        </p>
                                                        <div className="shrink-0 flex items-center gap-2">
                                                            {q.level !== undefined && (
                                                                <span className="rounded bg-gray-800 px-2 py-0.5 text-[10px] font-bold text-gray-400">L{q.level}</span>
                                                            )}
                                                            <span className={`text-xs font-bold ${q.marks >= 3 ? "text-green-400" : q.marks > 0 ? "text-yellow-400" : "text-red-400"}`}>
                                                                {q.marks}/5 marks
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {q.transcript && (
                                                        <p className="text-xs text-gray-400 border-l-2 border-gray-700 pl-3 italic">
                                                            &ldquo;{q.transcript}&rdquo;
                                                        </p>
                                                    )}
                                                    {q.feedback && (
                                                        <p className="flex items-start gap-2 text-xs text-purple-300">
                                                            <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                                            {q.feedback}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
