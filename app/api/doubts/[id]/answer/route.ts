import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

// POST – Teacher answers a doubt
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify the user is a teacher
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        });

        if (user?.role !== "TEACHER") {
            return NextResponse.json({ error: "Only teachers can answer doubts" }, { status: 403 });
        }

        const { answer } = await request.json();
        const { id } = await params;

        if (!answer) {
            return NextResponse.json({ error: "Answer is required" }, { status: 400 });
        }

        const doubt = await db.doubt.update({
            where: { id },
            data: {
                answer,
                answeredById: session.user.id,
                status: "ANSWERED",
            },
        });

        return NextResponse.json(doubt);
    } catch (error) {
        console.error("Error answering doubt:", error);
        return NextResponse.json({ error: "Failed to answer doubt" }, { status: 500 });
    }
}
