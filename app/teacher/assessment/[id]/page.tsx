import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import ContestEditor from "@/components/ContestEditor";
import AssessmentDetailView from "@/components/assessment/AssessmentDetailView";
import { parseAdaptiveLevels } from "@/lib/assessment-results";

export default async function TeacherAssessmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (session?.user?.role !== "TEACHER") {
        return <div>Unauthorized</div>;
    }

    const { id } = await params;
    // Teachers own global assessments only — org-scoped ones belong to that college's TPO.
    const assessment = await db.contest.findFirst({
        where: { id, organizationId: null },
        include: {
            problems: true,
            registrations: {
                include: { user: true },
                orderBy: { score: "desc" },
            },
        },
    });

    if (!assessment) {
        notFound();
    }

    // Round config is stored as a JSON blob in description
    let parsedConfig: { rounds?: any[]; description?: string } | null = null;
    if (assessment.description && assessment.description.startsWith("{")) {
        try {
            parsedConfig = JSON.parse(assessment.description);
        } catch { }
    }

    return (
        <AssessmentDetailView
            theme="dark"
            backHref="/teacher/assessment"
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
        >
            {/* Legacy manual editor, only when traditional problems exist */}
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
                            problems: [],
                        }}
                        problems={assessment.problems.map((p) => ({
                            ...p,
                            createdAt: p.createdAt.toISOString(),
                            updatedAt: p.updatedAt.toISOString(),
                        }))}
                    />
                </div>
            )}
        </AssessmentDetailView>
    );
}
