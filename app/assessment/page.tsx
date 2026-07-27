import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { ExternalLink, Clock, Calendar, CheckCircle2, XCircle } from "lucide-react";
import FormattedDate from "@/components/FormattedDate";

import ContestActionButtons from "@/components/contest/ContestActionButtons";
import StudentShell from "@/components/layout/StudentShell";

export default async function AssessmentPage() {
    const session = await auth();
    const assessments = await db.contest.findMany({
        where: { category: "ASSESSMENT" },
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
    
    // New: end time is in the future
    const newAssessments = notAttendedAssessments.filter(c => c.endTime > now);
    
    // Unattended: end time has passed
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
                                <AssessmentCard
                                    key={assessment.id}
                                    assessment={assessment}
                                    status="NEW"
                                />
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
                                <AssessmentCard
                                    key={assessment.id}
                                    assessment={assessment}
                                    status="ATTENDED"
                                    registration={registrationMap.get(assessment.id)}
                                />
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
                                <AssessmentCard
                                    key={assessment.id}
                                    assessment={assessment}
                                    status="UNATTENDED"
                                />
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

function AssessmentCard({ assessment, status, registration }: { assessment: any, status: "NEW" | "ATTENDED" | "UNATTENDED", registration?: any }) {
    const isExternal = assessment.type === "EXTERNAL";

    let borderColor = "border-gray-800 bg-[#161616] hover:border-gray-600";
    if (status === "NEW") {
        borderColor = "border-pink-500 bg-pink-900/10 hover:border-pink-400";
    } else if (status === "ATTENDED") {
        borderColor = "border-green-500 bg-green-900/10";
    } else if (status === "UNATTENDED") {
        borderColor = "border-gray-800 bg-[#111111] opacity-75";
    }

    return (
        <div className={`flex flex-col rounded-xl border p-6 transition-all ${borderColor}`}>
            <div className="mb-4">
                <div className="flex items-start justify-between">
                    <h3 className="font-bold text-lg line-clamp-1" title={assessment.title}>{assessment.title}</h3>
                    {isExternal && <ExternalLink className="h-4 w-4 text-gray-500" />}
                </div>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2 min-h-[2.5rem]">
                    {assessment.description || "No description provided."}
                </p>
            </div>

            <div className="mt-auto space-y-4">
                <div className="space-y-1 text-xs text-gray-500">
                    <div className="flex justify-between">
                        <span>Starts:</span>
                        <span className="text-gray-300">
                            <FormattedDate date={assessment.startTime.toISOString()} />
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Ends:</span>
                        <span className="text-gray-300">
                            <FormattedDate date={assessment.endTime.toISOString()} />
                        </span>
                    </div>
                    {isExternal && assessment.platformName && (
                        <div className="flex justify-between">
                            <span>Platform:</span>
                            <span className="text-blue-400">{assessment.platformName}</span>
                        </div>
                    )}
                    {status === "ATTENDED" && registration && (
                        <div className="flex justify-between mt-2 pt-2 border-t border-gray-800 text-green-400">
                            <span>Score:</span>
                            <span className="font-bold">{registration.score}</span>
                        </div>
                    )}
                </div>

                {status !== "UNATTENDED" && (
                    <ContestActionButtons
                        contestId={assessment.id}
                        type={assessment.type as "INTERNAL" | "EXTERNAL"}
                        contestLink={assessment.contestLink}
                        isRegistered={!!registration}
                        startTime={assessment.startTime.toISOString()}
                        endTime={assessment.endTime.toISOString()}
                    />
                )}
            </div>
        </div>
    );
}
