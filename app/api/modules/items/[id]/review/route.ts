import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: moduleItemId } = await params;
        const { messages } = await req.json();
        const userId = session.user.id;

        // Create or update progress with PENDING status
        await db.moduleItemProgress.upsert({
            where: {
                userId_moduleItemId: {
                    userId,
                    moduleItemId,
                },
            },
            update: {
                aiSubmission: messages,
                reviewStatus: "PENDING",
                isCompleted: false, // Ensure it's not marked as complete yet
            },
            create: {
                userId,
                moduleItemId,
                aiSubmission: messages,
                reviewStatus: "PENDING",
                isCompleted: false,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error submitting review:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
