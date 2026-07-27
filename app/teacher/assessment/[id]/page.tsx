import React from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { ArrowLeft, Clock, Calendar, Globe, Users, CheckSquare, Code, Mic, Trophy } from "lucide-react";
import ContestEditor from "@/components/ContestEditor";

const ROUND_META: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    mcq: { label: "MCQ Round", icon: CheckSquare, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/30" },
    coding: { label: "Coding Round", icon: Code, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30" },
    voice: { label: "Voice Round", icon: Mic, color: "text-green-400", bg: "bg-green-500/10 border-green-500/30" },
};

export default async function TeacherAssessmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (session?.user?.role !== "TEACHER") {
        return <div>Unauthorized</div>;
    }

    const { id } = await params;
    const assessment = await db.contest.findUnique({
        where: { id },
        include: {
            problems: true,
            registrations: {
                include: {
                    user: true
                },
                orderBy: {
                    score: "desc"
                }
            }
        }
    });

    if (!assessment) {
        notFound();
    }

    // Parse config if JSON
    let parsedConfig: { rounds?: any[]; description?: string } | null = null;
    if (assessment.description && assessment.description.startsWith("{")) {
        try {
            parsedConfig = JSON.parse(assessment.description);
        } catch { }
    }

    const displayDescription = parsedConfig?.description || assessment.description || "AI-powered assessment";
    const rounds = parsedConfig?.rounds || [];

    if (assessment.type === "EXTERNAL") {
        return (
            <div className="min-h-screen bg-[#0e0e0e] text-white p-8">
                <div className="max-w-4xl mx-auto">
                    <Link href="/teacher/assessment" className="mb-6 flex items-center gap-2 text-sm text-gray-400 hover:text-white">
                        <ArrowLeft className="h-4 w-4" /> Back to Assessments
                    </Link>
                    <div className="rounded-xl border border-gray-800 bg-[#161616] p-8">
                        <h1 className="text-3xl font-bold mb-4">{assessment.title} <span className="text-sm font-normal text-orange-400 border border-orange-900 bg-orange-900/20 px-2 py-1 rounded ml-2">EXTERNAL</span></h1>
                        <p className="text-gray-400 mb-6">{displayDescription}</p>

                        <div className="space-y-4 text-sm text-gray-300">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>Starts: {new Date(assessment.startTime).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>Ends: {new Date(assessment.endTime).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                <span>Platform: {assessment.platformName}</span>
                            </div>
                            <div className="mt-4 p-4 bg-[#111111] rounded border border-gray-800">
                                Link: <a href={assessment.contestLink || "#"} target="_blank" className="text-blue-400 hover:underline">{assessment.contestLink}</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0e0e0e] text-white p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <Link href="/teacher/assessment" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white">
                    <ArrowLeft className="h-4 w-4" /> Back to Assessments
                </Link>

                {/* Header Card */}
                <div className="rounded-xl border border-gray-800 bg-[#161616] p-6 space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{assessment.title}</h1>
                            <p className="text-gray-400">{displayDescription}</p>
                        </div>
                        <span className="rounded bg-pink-900/30 border border-pink-500/30 px-3 py-1 text-xs font-bold text-pink-400">
                            AI ASSESSMENT
                        </span>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-500 pt-2 border-t border-gray-800">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-400" />
                            <span>Starts: {new Date(assessment.startTime).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-green-400" />
                            <span>Ends: {new Date(assessment.endTime).toLocaleString()}</span>
                        </div>
                        {assessment.duration && (
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-purple-400" />
                                <span>Duration: {assessment.duration} min</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-orange-400" />
                            <span>{assessment.registrations.length} Students Registered</span>
                        </div>
                    </div>
                </div>

                {/* AI Configured Rounds */}
                {rounds.length > 0 && (
                    <div className="rounded-xl border border-gray-800 bg-[#161616] p-6 space-y-4">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-pink-400" /> Assessment Rounds Configuration
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {rounds.map((round: any, idx: number) => {
                                const meta = ROUND_META[round.type] || { label: round.type, icon: CheckSquare, color: "text-gray-400", bg: "bg-gray-800" };
                                const Icon = meta.icon;
                                return (
                                    <div key={idx} className={`rounded-xl border p-4 space-y-2 ${meta.bg}`}>
                                        <div className="flex items-center gap-2 font-bold text-sm">
                                            <Icon className={`h-4 w-4 ${meta.color}`} />
                                            <span className={meta.color}>{meta.label}</span>
                                        </div>
                                        <div className="text-xs text-gray-300 space-y-1">
                                            {round.type === "mcq" && (
                                                <>
                                                    <div>Role: <span className="text-white font-medium">{round.role}</span></div>
                                                    <div>Difficulty Level: <span className="text-white font-medium">{round.level}/10</span></div>
                                                    <div>Questions: <span className="text-white font-medium">{round.questionCount || 10}</span></div>
                                                </>
                                            )}
                                            {round.type === "coding" && (
                                                <>
                                                    <div>Difficulty Level: <span className="text-white font-medium">{round.level}/10</span></div>
                                                    <div>Problems: <span className="text-white font-medium">{round.problemCount || 3}</span></div>
                                                </>
                                            )}
                                            {round.type === "voice" && (
                                                <>
                                                    <div>Topic: <span className="text-white font-medium">{round.topic}</span></div>
                                                    <div>Difficulty Level: <span className="text-white font-medium">{round.level}/10</span></div>
                                                    <div>Questions: <span className="text-white font-medium">{round.questionCount || 10}</span></div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Participant Submissions / Leaderboard */}
                <div className="rounded-xl border border-gray-800 bg-[#161616] p-6 space-y-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-400" /> Student Submissions & Scores
                    </h2>

                    {assessment.registrations.length === 0 ? (
                        <p className="text-gray-500 text-sm italic">No students have registered or attempted this assessment yet.</p>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border border-gray-800 bg-[#111111]">
                            <table className="w-full text-left text-sm text-gray-300">
                                <thead className="bg-[#1a1a1a] text-xs uppercase text-gray-400 border-b border-gray-800">
                                    <tr>
                                        <th className="px-4 py-3">Student</th>
                                        <th className="px-4 py-3">Joined At</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {assessment.registrations.map((reg) => (
                                        <tr key={reg.id} className="hover:bg-gray-800/50">
                                            <td className="px-4 py-3 font-medium text-white">
                                                {reg.user.name || reg.user.email || "Student"}
                                            </td>
                                            <td className="px-4 py-3 text-gray-400">
                                                {new Date(reg.joinedAt).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                {reg.completedAt ? (
                                                    <span className="rounded bg-green-900/30 text-green-400 px-2 py-0.5 text-xs font-bold border border-green-900">
                                                        Completed
                                                    </span>
                                                ) : reg.startedAt ? (
                                                    <span className="rounded bg-yellow-900/30 text-yellow-400 px-2 py-0.5 text-xs font-bold border border-yellow-900">
                                                        In Progress
                                                    </span>
                                                ) : (
                                                    <span className="rounded bg-gray-800 text-gray-400 px-2 py-0.5 text-xs font-bold">
                                                        Registered
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-green-400">
                                                {reg.score}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Legacy Manual Contest Editor (only if traditional problems exist) */}
                {assessment.problems.length > 0 && (
                    <div className="pt-4 border-t border-gray-800">
                        <h2 className="text-lg font-bold text-white mb-4">Manual Problem Editor</h2>
                        <ContestEditor
                            contest={{
                                ...assessment,
                                startTime: assessment.startTime.toISOString(),
                                endTime: assessment.endTime.toISOString(),
                                createdAt: assessment.createdAt.toISOString(),
                                updatedAt: assessment.updatedAt.toISOString(),
                                problems: []
                            }}
                            problems={assessment.problems.map(p => ({
                                ...p,
                                createdAt: p.createdAt.toISOString(),
                                updatedAt: p.updatedAt.toISOString(),
                            }))}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
