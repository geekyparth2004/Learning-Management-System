import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
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

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const type = searchParams.get("type");
        const includeDrafts = searchParams.get("drafts") === "true";

        const drives = await db.recruitmentDrive.findMany({
            where: {
                organizationId: user.organizationId,
                ...(status && { status }),
                ...(type && { type }),
                ...(!includeDrafts && { isDraft: false }),
            },
            orderBy: { createdAt: "desc" },
            include: {
                _count: { select: { applications: true } },
            },
        });

        return NextResponse.json({ drives });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
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

        const body = await req.json();
        const {
            company, role, location, driveDate, status, type,
            eligibility, description, skillsRequired, minCgpa,
            batchYear, isDraft,
        } = body;

        if (!company || !role || !driveDate) {
            return NextResponse.json({ error: "Company, role and date are required" }, { status: 400 });
        }

        // Create drive + auto-create group in one go
        const drive = await db.recruitmentDrive.create({
            data: {
                organizationId: user.organizationId,
                company,
                role,
                location,
                driveDate: new Date(driveDate),
                status: status || "UPCOMING",
                type: type || "ON_CAMPUS",
                eligibility,
                description,
                skillsRequired,
                minCgpa: minCgpa ? parseFloat(minCgpa) : null,
                batchYear,
                isDraft: isDraft || false,
            },
        });

        // Auto-create coordination group for this drive
        if (!isDraft) {
            await db.placementGroup.create({
                data: {
                    organizationId: user.organizationId,
                    driveId: drive.id,
                    name: `${company} - ${role}`,
                    description: `Coordination group for ${company} ${role} drive`,
                    color: ["blue", "green", "purple", "orange", "teal"][Math.floor(Math.random() * 5)],
                },
            });
        }

        return NextResponse.json({ drive });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
