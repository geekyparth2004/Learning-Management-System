import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

function calcTrend(current: number, previous: number): { change: string; positive: boolean } {
    if (previous === 0 && current === 0) return { change: "0%", positive: true };
    if (previous === 0) return { change: "+100%", positive: true };
    const pct = Math.round(((current - previous) / previous) * 100);
    return {
        change: pct >= 0 ? `+${pct}%` : `${pct}%`,
        positive: pct >= 0,
    };
}

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "COORDINATOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { organizationId: true },
        });

        if (!user?.organizationId) {
            return NextResponse.json({ error: "No organization" }, { status: 403 });
        }

        const orgId = user.organizationId;

        // Time windows: last 30 days vs prior 30 days
        const now = new Date();
        const last30Start = new Date(now);
        last30Start.setDate(now.getDate() - 30);
        const prior30Start = new Date(now);
        prior30Start.setDate(now.getDate() - 60);

        const [
            // Current totals (snapshot)
            activeDrives,
            totalStudents,
            pendingApps,
            shortlistedApps,
            totalApps,
            placedApps,

            // Last 30 days: drives created
            drivesLast30,
            // Prior 30 days: drives created
            drivesPrior30,

            // Last 30 days: new applications
            appsLast30,
            // Prior 30 days: new applications
            appsPrior30,

            // Last 30 days: shortlisted updates
            shortlistedLast30,
            // Prior 30 days: shortlisted updates
            shortlistedPrior30,

            // Last 30 days: placed updates
            placedLast30,
            // Prior 30 days: placed updates
            placedPrior30,

            // Students joined in each period (for engagement trend)
            studentsLast30,
            studentsPrior30,
        ] = await Promise.all([
            // ── Current snapshot counts ──────────────────────────────────────
            db.recruitmentDrive.count({
                where: { organizationId: orgId, status: { not: "COMPLETED" }, isDraft: false },
            }),
            db.user.count({
                where: { organizationId: orgId, role: "STUDENT" },
            }),
            db.placementApplication.count({
                where: { drive: { organizationId: orgId }, status: "APPLIED" },
            }),
            db.placementApplication.count({
                where: { drive: { organizationId: orgId }, status: "SHORTLISTED" },
            }),
            db.placementApplication.count({
                where: { drive: { organizationId: orgId } },
            }),
            db.placementApplication.count({
                where: { drive: { organizationId: orgId }, status: "PLACED" },
            }),

            // ── Active drives created in each window ─────────────────────────
            db.recruitmentDrive.count({
                where: {
                    organizationId: orgId,
                    isDraft: false,
                    createdAt: { gte: last30Start },
                },
            }),
            db.recruitmentDrive.count({
                where: {
                    organizationId: orgId,
                    isDraft: false,
                    createdAt: { gte: prior30Start, lt: last30Start },
                },
            }),

            // ── Applications submitted in each window ────────────────────────
            db.placementApplication.count({
                where: {
                    drive: { organizationId: orgId },
                    appliedAt: { gte: last30Start },
                },
            }),
            db.placementApplication.count({
                where: {
                    drive: { organizationId: orgId },
                    appliedAt: { gte: prior30Start, lt: last30Start },
                },
            }),

            // ── Shortlisted status updates in each window ────────────────────
            db.placementApplication.count({
                where: {
                    drive: { organizationId: orgId },
                    status: "SHORTLISTED",
                    updatedAt: { gte: last30Start },
                },
            }),
            db.placementApplication.count({
                where: {
                    drive: { organizationId: orgId },
                    status: "SHORTLISTED",
                    updatedAt: { gte: prior30Start, lt: last30Start },
                },
            }),

            // ── Placed status updates in each window ─────────────────────────
            db.placementApplication.count({
                where: {
                    drive: { organizationId: orgId },
                    status: "PLACED",
                    updatedAt: { gte: last30Start },
                },
            }),
            db.placementApplication.count({
                where: {
                    drive: { organizationId: orgId },
                    status: "PLACED",
                    updatedAt: { gte: prior30Start, lt: last30Start },
                },
            }),

            // ── New students in each window (for engagement trend) ───────────
            db.user.count({
                where: {
                    organizationId: orgId,
                    role: "STUDENT",
                    createdAt: { gte: last30Start },
                },
            }),
            db.user.count({
                where: {
                    organizationId: orgId,
                    role: "STUDENT",
                    createdAt: { gte: prior30Start, lt: last30Start },
                },
            }),
        ]);

        const engagement = totalStudents > 0
            ? Math.round((totalApps / totalStudents) * 100)
            : 0;

        // Compute trends
        // Active opportunities: compare drives created this window vs prior
        const opportunityTrend = calcTrend(drivesLast30, drivesPrior30);

        // Student engagement: compare app rate in each window
        const engagementLast30 = studentsLast30 > 0
            ? Math.round((appsLast30 / studentsLast30) * 100)
            : appsLast30 > 0 ? 100 : 0;
        const engagementPrior30 = studentsPrior30 > 0
            ? Math.round((appsPrior30 / studentsPrior30) * 100)
            : appsPrior30 > 0 ? 100 : 0;
        const engagementTrend = calcTrend(engagementLast30, engagementPrior30);

        // Pending approvals: compare new applications each window (more = worse)
        const pendingTrend = calcTrend(appsLast30, appsPrior30);
        // Flip sign: if more pending applications came in, that's a negative trend
        pendingTrend.positive = !pendingTrend.positive;

        // Shortlisted: compare shortlisted updates each window
        const shortlistedTrend = calcTrend(shortlistedLast30, shortlistedPrior30);

        return NextResponse.json({
            stats: {
                activeOpportunities: activeDrives,
                studentEngagement: Math.min(engagement, 100),
                pendingApprovals: pendingApps,
                shortlistedStudents: shortlistedApps,
                totalApplications: totalApps,
                placedStudents: placedApps,
                totalStudents,
                trends: {
                    activeOpportunities: opportunityTrend,
                    studentEngagement: engagementTrend,
                    pendingApprovals: pendingTrend,
                    shortlistedStudents: shortlistedTrend,
                },
            },
        });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
