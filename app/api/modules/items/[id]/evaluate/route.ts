import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { deleteFromR2 } from "@/lib/s3";

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
        const { userId, status, feedback } = await req.json();

        if (!userId || !status) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Add additional check: Ensure session.user.id is the teacher of the course?
        // Skipping for now as requested.

        // Fetch existing progress to get audio URLs
        const existingProgress = await db.moduleItemProgress.findUnique({
            where: {
                userId_moduleItemId: {
                    userId,
                    moduleItemId,
                },
            },
        });

        if (status === "APPROVED" && existingProgress?.aiSubmission) {
            try {
                const messages = JSON.parse(existingProgress.aiSubmission);
                for (const msg of messages) {
                    if (msg.audioUrl) {
                        await deleteFromR2(msg.audioUrl);
                    }
                }
            } catch (e) {
                console.error("Failed to parse submission for deletion", e);
            }
        }

        const updatedProgress = await db.moduleItemProgress.update({
            where: {
                userId_moduleItemId: {
                    userId,
                    moduleItemId,
                },
            },
            data: {
                reviewStatus: status, // "APPROVED" or "REJECTED"
                isCompleted: status === "APPROVED", // Mark complete if approved
                // If Approved, clear the submission data as requested
                aiSubmission: status === "APPROVED" ? null : undefined,
            },
        });

        return NextResponse.json(updatedProgress);
    } catch (error) {
        console.error("Error evaluating submission:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
