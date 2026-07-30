import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * Creates an assessment scoped to the coordinator's own organization.
 *
 * organizationId, category and type are all forced server-side — the client cannot
 * send them, so a TPO can never create a global assessment, contest or hackathon.
 */
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
        // Only these five fields are read off the request.
        const { title, description, startTime, endTime, duration } = body;

        if (!title || !startTime || !endTime) {
            return NextResponse.json({ error: "Title, start time and end time are required" }, { status: 400 });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return NextResponse.json({ error: "Invalid start or end time" }, { status: 400 });
        }
        if (end <= start) {
            return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
        }

        const assessment = await db.contest.create({
            data: {
                title,
                description,
                type: "INTERNAL",
                category: "ASSESSMENT",
                organizationId: user.organizationId,
                startTime: start,
                endTime: end,
                duration: duration ? parseInt(String(duration)) : null,
            },
        });

        return NextResponse.json({ assessment });
    } catch (error) {
        console.error("Failed to create coordinator assessment", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
