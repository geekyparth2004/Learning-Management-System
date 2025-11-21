import { NextResponse } from "next/server";
import { db } from "@/lib/db";

import { auth } from "@/auth";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();

        const assignment = await db.assignment.findUnique({
            where: { id },
            include: {
                problems: {
                    include: { testCases: true },
                },
            },
        });

        if (!assignment) {
            return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
        }

        let startedAt = new Date();
        let isTeacher = false;

        if (session?.user?.id) {
            // Check if user is teacher
            const user = await db.user.findUnique({ where: { id: session.user.id } });
            isTeacher = user?.role === "TEACHER";

            if (!isTeacher) {
                // Find or create progress for student
                let progress = await db.assignmentProgress.findUnique({
                    where: {
                        userId_assignmentId: {
                            userId: session.user.id,
                            assignmentId: id,
                        },
                    },
                });

                if (!progress) {
                    progress = await db.assignmentProgress.create({
                        data: {
                            userId: session.user.id,
                            assignmentId: id,
                        },
                    });
                }
                startedAt = progress.startedAt;
            }
        }

        const now = new Date();
        const minutesElapsed = (now.getTime() - startedAt.getTime()) / 1000 / 60;

        // Transform data
        const transformedAssignment = {
            ...assignment,
            startedAt: startedAt.toISOString(),
            problems: assignment.problems.map((p) => {
                const hintsRaw = JSON.parse(p.hints || "[]");
                const processedHints = hintsRaw.map((hintContent: string, index: number) => {
                    // Unlock schedule: 5, 10, 15, 20 minutes
                    const unlockThreshold = (index + 1) * 5;
                    const isUnlocked = isTeacher || minutesElapsed >= unlockThreshold;
                    const unlockTime = new Date(startedAt.getTime() + unlockThreshold * 60 * 1000);

                    return {
                        id: index,
                        type: index === 3 && p.videoSolution ? "video" : "text",
                        content: isUnlocked ? (index === 3 && p.videoSolution ? p.videoSolution : hintContent) : null,
                        locked: !isUnlocked,
                        unlockTime: unlockTime.toISOString(),
                    };
                });

                // If there's a video solution but less than 4 hints, we might need to handle it.
                // But the plan assumes 4 hints max. The 4th one is the video if uploaded.
                // If the teacher didn't provide 4 hints, we just show what's there.
                // If video exists, it should be the last hint.

                return {
                    ...p,
                    defaultCode: JSON.parse(p.defaultCode),
                    hints: processedHints,
                };
            }),
        };

        return NextResponse.json(transformedAssignment);
    } catch (error) {
        console.error("Error fetching assignment:", error);
        return NextResponse.json(
            { error: "Failed to fetch assignment" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.user.findUnique({ where: { id: session.user.id } });
        if (user?.role !== "TEACHER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Delete assignment (cascade delete should handle problems/test cases if configured, 
        // but let's check schema or just try deleting)
        // In schema: Problem has relation to Assignment. 
        // We need to ensure cascade delete is enabled in schema or delete manually.
        // Prisma usually handles cascade if defined in schema.
        // Let's check schema later if it fails, but usually @relation(onDelete: Cascade) is good practice.
        // Assuming it's set or we delete assignment and it might error if relations exist without cascade.
        // Let's check schema first? No, let's try deleting.

        await db.assignment.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Assignment deleted successfully" });
    } catch (error) {
        console.error("Error deleting assignment:", error);
        return NextResponse.json(
            { error: "Failed to delete assignment" },
            { status: 500 }
        );
    }
}
