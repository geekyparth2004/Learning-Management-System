import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Plus, Calendar, Clock, Users, ArrowRight, ClipboardList, Shield } from "lucide-react";
import CoordinatorTopBar from "@/components/coordinator/CoordinatorTopBar";
import DeleteAssessmentButton from "@/components/coordinator/DeleteAssessmentButton";
import { roundMeta } from "@/components/assessment/round-meta";

export const dynamic = "force-dynamic";

function parseRounds(description: string | null): { type: string }[] {
    if (!description) return [];
    try {
        return JSON.parse(description).rounds || [];
    } catch {
        return [];
    }
}

function parseDescription(description: string | null): string {
    if (!description) return "AI-powered assessment";
    try {
        return JSON.parse(description).description || "AI-powered assessment";
    } catch {
        return description;
    }
}

export default async function CoordinatorAssessmentsPage() {
    // Defence in depth: the coordinator layout already gates, but never rely on a parent alone.
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "COORDINATOR") redirect("/");

    const me = await db.user.findUnique({
        where: { id: session.user.id },
        select: { organizationId: true, organization: { select: { name: true } } },
    });
    if (!me?.organizationId) redirect("/");

    // Own organization only — global (teacher-created) assessments are not managed here.
    const assessments = await db.contest.findMany({
        where: { category: "ASSESSMENT", organizationId: me.organizationId },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { registrations: true } } },
    });

    const meta = roundMeta("light");
    const now = new Date();

    return (
        <div className="min-h-screen">
            <CoordinatorTopBar active="assessments" searchPlaceholder="Search assessments..." />

            <main className="p-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Manage Assessments</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Create AI-powered assessments for {me.organization?.name || "your organization"} and track student performance.
                        </p>
                    </div>
                    <Link
                        href="/coordinator/assessments/create"
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Create Assessment
                    </Link>
                </div>

                {/* Scope notice */}
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <Shield className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                    <p className="text-sm text-blue-800">
                        Assessments you create here are visible <strong>only</strong> to students of{" "}
                        {me.organization?.name || "your organization"}.
                    </p>
                </div>

                {assessments.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                            <ClipboardList className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">No assessments yet</p>
                        <p className="mt-1 text-sm text-gray-500">
                            Create your first assessment to evaluate your students.
                        </p>
                        <Link
                            href="/coordinator/assessments/create"
                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4" /> Create Assessment
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {assessments.map((assessment) => {
                            const rounds = parseRounds(assessment.description);
                            const isLive = assessment.startTime <= now && assessment.endTime > now;
                            const hasEnded = assessment.endTime <= now;
                            return (
                                <div key={assessment.id} className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                                    <div className="mb-3">
                                        <div className="mb-1 flex items-start justify-between gap-2">
                                            <h3 className="line-clamp-1 font-bold text-gray-900" title={assessment.title}>
                                                {assessment.title}
                                            </h3>
                                            {isLive ? (
                                                <span className="shrink-0 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">
                                                    LIVE
                                                </span>
                                            ) : hasEnded ? (
                                                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
                                                    ENDED
                                                </span>
                                            ) : (
                                                <span className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                                                    UPCOMING
                                                </span>
                                            )}
                                        </div>
                                        <p className="line-clamp-2 min-h-[2.5rem] text-sm text-gray-500">
                                            {parseDescription(assessment.description)}
                                        </p>
                                    </div>

                                    {rounds.length > 0 && (
                                        <div className="mb-4 flex flex-wrap gap-1.5">
                                            {rounds.map((round, idx) => {
                                                const rm = meta[round.type];
                                                if (!rm) return null;
                                                const Icon = rm.icon;
                                                return (
                                                    <span key={idx} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${rm.bg} ${rm.color}`}>
                                                        <Icon className="h-3 w-3" /> {rm.label.replace(/ (Round|Challenge|Prediction|Writing)$/, "")}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <div className="mt-auto space-y-2 text-xs text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                            <span>{new Date(assessment.startTime).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-3.5 w-3.5 text-green-500" />
                                            <span>{new Date(assessment.endTime).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users className="h-3.5 w-3.5 text-orange-500" />
                                            <span>{assessment._count.registrations} registered</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
                                        <Link
                                            href={`/coordinator/assessments/${assessment.id}`}
                                            className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            View Results <ArrowRight className="h-3.5 w-3.5" />
                                        </Link>
                                        <DeleteAssessmentButton id={assessment.id} title={assessment.title} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
