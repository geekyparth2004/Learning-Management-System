import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import CoordinatorTopBar from "@/components/coordinator/CoordinatorTopBar";
import AssessmentBuilderForm from "@/components/assessment/AssessmentBuilderForm";

export const dynamic = "force-dynamic";

export default async function CoordinatorCreateAssessmentPage() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "COORDINATOR") redirect("/");

    const me = await db.user.findUnique({
        where: { id: session.user.id },
        select: { organizationId: true, organization: { select: { name: true } } },
    });
    if (!me?.organizationId) redirect("/");

    const orgName = me.organization?.name || "your organization";

    return (
        <div className="min-h-screen">
            <CoordinatorTopBar active="assessments" />
            {/* organizationId, category and type are all forced server-side by the POST handler. */}
            <AssessmentBuilderForm
                theme="light"
                endpoint="/api/coordinator/assessments"
                successRedirect="/coordinator/assessments"
                backHref="/coordinator/assessments"
                scopeNotice={`This assessment will be visible only to students of ${orgName}.`}
            />
        </div>
    );
}
