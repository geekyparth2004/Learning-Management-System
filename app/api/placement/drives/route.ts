import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user's organization
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { organizationId: true },
        });

        if (!user?.organizationId) {
            return NextResponse.json({ error: "Not an organization student" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status"); // "UPCOMING" | "ONGOING" | "COMPLETED"

        const drives = await db.recruitmentDrive.findMany({
            where: {
                organizationId: user.organizationId,
                ...(status && { status }),
            },
            orderBy: { driveDate: "desc" },
            include: {
                _count: { select: { applications: true } },
            },
        });

        // Check which drives the user has applied to
        const userApplications = await db.placementApplication.findMany({
            where: { userId: session.user.id },
            select: { driveId: true },
        });
        const appliedDriveIds = new Set(userApplications.map((a) => a.driveId));

        const drivesWithStatus = drives.map((drive) => ({
            ...drive,
            hasApplied: appliedDriveIds.has(drive.id),
            applicantCount: drive._count.applications,
        }));

        return NextResponse.json({ drives: drivesWithStatus });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
