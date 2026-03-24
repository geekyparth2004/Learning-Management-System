import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

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

        const [
            activeDrives,
            totalStudents,
            pendingApps,
            shortlistedApps,
            totalApps,
            placedApps,
        ] = await Promise.all([
            db.recruitmentDrive.count({
                where: { organizationId: orgId, status: { not: "COMPLETED" }, isDraft: false },
            }),
            db.user.count({
                where: { organizationId: orgId, role: "STUDENT" },
            }),
            db.placementApplication.count({
                where: {
                    drive: { organizationId: orgId },
                    status: "APPLIED",
                },
            }),
            db.placementApplication.count({
                where: {
                    drive: { organizationId: orgId },
                    status: "SHORTLISTED",
                },
            }),
            db.placementApplication.count({
                where: { drive: { organizationId: orgId } },
            }),
            db.placementApplication.count({
                where: {
                    drive: { organizationId: orgId },
                    status: "PLACED",
                },
            }),
        ]);

        const engagement = totalStudents > 0
            ? Math.round((totalApps / totalStudents) * 100)
            : 0;

        return NextResponse.json({
            stats: {
                activeOpportunities: activeDrives,
                studentEngagement: Math.min(engagement, 100),
                pendingApprovals: pendingApps,
                shortlistedStudents: shortlistedApps,
                totalApplications: totalApps,
                placedStudents: placedApps,
                totalStudents,
            },
        });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
