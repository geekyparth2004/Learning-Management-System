import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const applications = await db.placementApplication.findMany({
            where: { userId: session.user.id },
            orderBy: { appliedAt: "desc" },
            include: {
                drive: {
                    select: {
                        company: true,
                        role: true,
                        location: true,
                        companyLogo: true,
                        driveDate: true,
                    },
                },
            },
        });

        return NextResponse.json({ applications });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { driveId } = await req.json();

        if (!driveId) {
            return NextResponse.json({ error: "Drive ID required" }, { status: 400 });
        }

        // Verify drive exists and belongs to user's org
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { organizationId: true },
        });

        const drive = await db.recruitmentDrive.findUnique({
            where: { id: driveId },
            include: { group: true },
        });

        if (!drive || drive.organizationId !== user?.organizationId) {
            return NextResponse.json({ error: "Drive not found" }, { status: 404 });
        }

        // Check if already applied
        const existing = await db.placementApplication.findUnique({
            where: { userId_driveId: { userId: session.user.id, driveId } },
        });

        if (existing) {
            return NextResponse.json({ error: "Already applied" }, { status: 409 });
        }

        // Create application
        const application = await db.placementApplication.create({
            data: {
                userId: session.user.id,
                driveId,
            },
        });

        // Auto-join the drive's group (if it exists)
        if (drive.group) {
            await db.placementGroupMember.upsert({
                where: {
                    userId_groupId: {
                        userId: session.user.id,
                        groupId: drive.group.id,
                    },
                },
                update: {},
                create: {
                    userId: session.user.id,
                    groupId: drive.group.id,
                },
            });
        }

        return NextResponse.json({ application });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
