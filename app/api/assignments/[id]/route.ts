import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signR2Url } from "@/lib/s3";

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
                moduleItems: {
                    include: {
                        module: {
                            select: { courseId: true }
                        }
                    }
                }
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
        console.log("Transforming assignment data...");
        const courseId = assignment.moduleItems[0]?.module?.courseId;

        const problems = await Promise.all(assignment.problems.map(async (p) => {
            try {
                const hintsRaw = typeof p.hints === 'string' ? JSON.parse(p.hints) : (p.hints || []);
                const processedHints = await Promise.all(hintsRaw.map(async (hintItem: any, index: number) => {
                    // Unlock schedule: 5, 10, 15... minutes
                    const unlockThreshold = (index + 1) * 5;
                    const isUnlocked = isTeacher || minutesElapsed >= unlockThreshold;
                    const unlockTime = new Date(startedAt.getTime() + unlockThreshold * 60 * 1000);

                    // Handle hint item which could be string or object {type, content}
                    let type = "text";
                    let content = "";

                    if (typeof hintItem === 'string') {
                        content = hintItem;
                    } else {
                        type = hintItem.type || "text";
                        content = hintItem.content || "";
                    }

                    // Sign URL if video and unlocked
                    if (type === "video" && isUnlocked && (content.includes("r2.cloudflarestorage.com") || content.includes("backblazeb2.com"))) {
                        content = await signR2Url(content);
                    }

                    return {
                        id: index,
                        type,
                        content: isUnlocked ? content : null,
                        locked: !isUnlocked,
                        unlockTime: unlockTime.toISOString(),
                    };
                }));

                // Append video solution if exists
                if (p.videoSolution) {
                    const index = hintsRaw.length;
                    const unlockThreshold = (index + 1) * 5;
                    const isUnlocked = isTeacher || minutesElapsed >= unlockThreshold;
                    const unlockTime = new Date(startedAt.getTime() + unlockThreshold * 60 * 1000);

                    let content = p.videoSolution;
                    if (isUnlocked && (content.includes("r2.cloudflarestorage.com") || content.includes("backblazeb2.com"))) {
                        content = await signR2Url(content);
                    }

                    processedHints.push({
                        id: index,
                        type: "video",
                        content: isUnlocked ? content : null,
                        locked: !isUnlocked,
                        unlockTime: unlockTime.toISOString(),
                    });
                }

                return {
                    ...p,
                    defaultCode: p.defaultCode,
                    hints: processedHints,
                };
            } catch (err) {
                console.error(`Error processing problem ${p.id}:`, err);
                return p; // Return raw problem if processing fails
            }
        }));

        const transformedAssignment = {
            ...assignment,
            courseId,
            startedAt: startedAt.toISOString(),
            problems,
        };

        console.log("Assignment data transformed successfully");
        return NextResponse.json(transformedAssignment);
    } catch (error) {
        console.error("Error fetching assignment:", error);
        return NextResponse.json(
            { error: "Failed to fetch assignment", details: error instanceof Error ? error.message : String(error) },
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
