import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { CheckSquare, Code, Mic, CheckCircle2, XCircle, Clock, ArrowRight, Trophy, Bug, Terminal, Database, Mail, Brain } from "lucide-react";
import FormattedDate from "@/components/FormattedDate";
import StudentShell from "@/components/layout/StudentShell";
import { viewerOrgId, visibleContestWhere } from "@/lib/org-scope";

export default async function AssessmentPage() {
    const session = await auth();
    // Global assessments plus any restricted to this student's own organization.
    const orgId = await viewerOrgId(session?.user?.id);
    const assessments = await db.contest.findMany({
        where: { category: "ASSESSMENT", ...visibleContestWhere(orgId) },
        orderBy: { startTime: "asc" },
    });

    // Fetch registrations
    const registrations = session?.user?.id ? await db.contestRegistration.findMany({
        where: { userId: session.user.id }
    }) : [];
    const registrationMap = new Map(registrations.map(r => [r.contestId, r]));

    const now = new Date();
    
    // Categorize Assessments
    const attendedAssessments = assessments.filter(c => registrationMap.has(c.id));
    const notAttendedAssessments = assessments.filter(c => !registrationMap.has(c.id));
    const newAssessments = notAttendedAssessments.filter(c => c.endTime > now);
    const unattendedAssessments = notAttendedAssessments.filter(c => c.endTime <= now);

    return (
        <StudentShell>
        <div className="min-h-[100dvh] bg-[#0e0e0e] text-white px-4 py-6 md:p-8">
            <div className="max-w-5xl mx-auto space-y-8 md:space-y-12">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Link href="/" className="text-sm text-gray-400 hover:text-white mb-2 block">← Back to Dashboard</Link>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-600 bg-clip-text text-transparent">
                            Assessment Mode
                        </h1>
                        <p className="text-gray-400 mt-2">Take skill assessments and track your performance.</p>
                    </div>
                </div>

                {/* New Assessments */}
                <section>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-pink-400">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                        </span>
                        New Assessments
                    </h2>
                    {newAssessments.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {newAssessments.map(assessment => (
                                <AssessmentCard key={assessment.id} assessment={assessment} status="NEW" />
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No new assessments available.</p>
                    )}
                </section>

                {/* Attended Assessments */}
                <section>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-400">
                        <CheckCircle2 className="h-5 w-5" />
                        Attended Assessments
                    </h2>
                    {attendedAssessments.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {attendedAssessments.map(assessment => (
                                <AssessmentCard key={assessment.id} assessment={assessment} status="ATTENDED"
                                    registration={registrationMap.get(assessment.id)} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">You haven't attended any assessments yet.</p>
                    )}
                </section>

                {/* Unattended Assessments */}
                <section>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-400">
                        <XCircle className="h-5 w-5" />
                        Unattended Assessments
                    </h2>
                    {unattendedAssessments.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {unattendedAssessments.map(assessment => (
                                <AssessmentCard key={assessment.id} assessment={assessment} status="UNATTENDED" />
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No unattended assessments found.</p>
                    )}
                </section>
            </div>
        </div>
        </StudentShell>
    );
}

function parseRounds(description: string | null): { type: string }[] {
    if (!description) return [];
    try {
        const parsed = JSON.parse(description);
        return parsed.rounds || [];
    } catch {
        return [];
    }
}

const ROUND_BADGES: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    mcq: { label: "MCQ", icon: CheckSquare, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/30" },
    coding: { label: "Coding", icon: Code, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30" },
    voice: { label: "Voice", icon: Mic, color: "text-green-400", bg: "bg-green-500/10 border-green-500/30" },
    debug: { label: "Debug", icon: Bug, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30" },
    output: { label: "Output", icon: Terminal, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/30" },
    sql: { label: "SQL", icon: Database, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/30" },
    email: { label: "Email", icon: Mail, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
    aptitude: { label: "Aptitude", icon: Brain, color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/30" },
};

function AssessmentCard({ assessment, status, registration }: { assessment: any; status: "NEW" | "ATTENDED" | "UNATTENDED"; registration?: any }) {
    const rounds = parseRounds(assessment.description);
    const now = new Date();
    const isLive = assessment.startTime <= now && assessment.endTime > now;
    const hasEnded = assessment.endTime <= now;

    let borderColor = "border-gray-800 bg-[#161616] hover:border-gray-600";
    if (status === "NEW" && isLive) {
        borderColor = "border-pink-500 bg-pink-900/10 hover:border-pink-400";
    } else if (status === "NEW") {
        borderColor = "border-purple-500/50 bg-purple-900/5 hover:border-purple-400";
    } else if (status === "ATTENDED") {
        borderColor = "border-green-500/50 bg-green-900/5";
    } else if (status === "UNATTENDED") {
        borderColor = "border-gray-800 bg-[#111111] opacity-70";
    }

    // Parse human-readable description from config
    let displayDescription = "";
    try {
        const parsed = JSON.parse(assessment.description || "{}");
        displayDescription = parsed.description || "";
    } catch {
        displayDescription = assessment.description || "";
    }

    return (
        <div className={`flex flex-col rounded-xl border p-6 transition-all ${borderColor}`}>
            <div className="mb-3">
                <div className="flex items-start justify-between mb-1">
                    <h3 className="font-bold text-lg line-clamp-1" title={assessment.title}>{assessment.title}</h3>
                    {isLive && status === "NEW" && (
                        <span className="shrink-0 ml-2 rounded-full bg-pink-500/20 px-2 py-0.5 text-[10px] font-bold text-pink-400 border border-pink-500/30 animate-pulse">
                            LIVE
                        </span>
                    )}
                </div>
                <p className="text-sm text-gray-400 line-clamp-2 min-h-[2.5rem]">
                    {displayDescription || "AI-powered assessment"}
                </p>
            </div>

            {/* Round badges */}
            {rounds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {rounds.map((round, idx) => {
                        const meta = ROUND_BADGES[round.type];
                        if (!meta) return null;
                        const Icon = meta.icon;
                        return (
                            <span key={idx} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.bg} ${meta.color}`}>
                                <Icon className="h-3 w-3" /> {meta.label}
                            </span>
                        );
                    })}
                </div>
            )}

            <div className="mt-auto space-y-3">
                <div className="space-y-1 text-xs text-gray-500">
                    <div className="flex justify-between">
                        <span>Starts:</span>
                        <span className="text-gray-300"><FormattedDate date={assessment.startTime.toISOString()} /></span>
                    </div>
                    <div className="flex justify-between">
                        <span>Ends:</span>
                        <span className="text-gray-300"><FormattedDate date={assessment.endTime.toISOString()} /></span>
                    </div>
                    {assessment.duration && (
                        <div className="flex justify-between">
                            <span>Duration:</span>
                            <span className="text-gray-300">{assessment.duration} min</span>
                        </div>
                    )}
                    {status === "ATTENDED" && registration && (
                        <div className="flex justify-between mt-2 pt-2 border-t border-gray-800 text-green-400">
                            <span>Score:</span>
                            {/* Scores stay hidden until the assessment ends for everyone */}
                            {hasEnded ? (
                                <span className="font-bold">{registration.score}</span>
                            ) : (
                                <span className="font-bold text-yellow-400">Pending</span>
                            )}
                        </div>
                    )}
                </div>

                {status === "NEW" && isLive && (
                    <Link href={`/assessment/${assessment.id}`}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 py-2.5 text-sm font-bold text-white hover:from-pink-500 hover:to-purple-500 transition-all"
                    >
                        Start Assessment <ArrowRight className="h-4 w-4" />
                    </Link>
                )}
                {status === "NEW" && !isLive && (
                    <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-800 py-2.5 text-sm font-medium text-gray-400 border border-gray-700">
                        <Clock className="h-4 w-4" /> Starts Soon
                    </div>
                )}
                {hasEnded && (
                    <Link href={`/assessment/${assessment.id}`}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-800 py-2.5 text-sm font-bold text-purple-300 hover:bg-gray-700 border border-purple-500/30 transition-all"
                    >
                        <Trophy className="h-4 w-4" /> View Results & Leaderboard
                    </Link>
                )}
            </div>
        </div>
    );
}
