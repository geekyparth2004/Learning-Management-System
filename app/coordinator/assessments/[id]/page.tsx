import React from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import CoordinatorTopBar from "@/components/coordinator/CoordinatorTopBar";
import AssessmentDetailView from "@/components/assessment/AssessmentDetailView";
import { parseAdaptiveLevels } from "@/lib/assessment-results";

export const dynamic = "force-dynamic";

export default async function CoordinatorAssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "COORDINATOR") redirect("/");

    const me = await db.user.findUnique({
        where: { id: session.user.id },
        select: { organizationId: true, organization: { select: { name: true } } },
    });
    if (!me?.organizationId) redirect("/");

    const { id } = await params;
    // Ownership is folded into the query, so another org's id is an ordinary 404
    // rather than a distinguishable "exists but forbidden".
    const assessment = await db.contest.findFirst({
        where: { id, category: "ASSESSMENT", organizationId: me.organizationId },
        include: {
            registrations: {
                include: { user: true },
                orderBy: { score: "desc" },
            },
        },
    });

    if (!assessment) {
        notFound();
    }

    let parsedConfig: { rounds?: any[]; description?: string } | null = null;
    if (assessment.description && assessment.description.startsWith("{")) {
        try {
            parsedConfig = JSON.parse(assessment.description);
        } catch { }
    }

    return (
        <div className="min-h-screen">
            <CoordinatorTopBar active="assessments" />
            <AssessmentDetailView
                theme="light"
                backHref="/coordinator/assessments"
                scopeBadge={me.organization?.name ?? null}
                assessment={{
                    title: assessment.title,
                    type: assessment.type,
                    platformName: assessment.platformName,
                    contestLink: assessment.contestLink,
                    startTime: assessment.startTime.toISOString(),
                    endTime: assessment.endTime.toISOString(),
                    duration: assessment.duration,
                    displayDescription: parsedConfig?.description || assessment.description || "AI-powered assessment",
                }}
                rounds={parsedConfig?.rounds || []}
                registrations={assessment.registrations.map((reg) => ({
                    id: reg.id,
                    name: reg.user.name || reg.user.email || "Student",
                    joinedAt: reg.joinedAt.toISOString(),
                    startedAt: reg.startedAt?.toISOString() ?? null,
                    completedAt: reg.completedAt?.toISOString() ?? null,
                    score: reg.score,
                    adaptiveLevels: parseAdaptiveLevels(reg.results),
                }))}
            />
        </div>
    );
}
