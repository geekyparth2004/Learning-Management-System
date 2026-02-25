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

        // If APPROVED, check if module is completed and unlock next
        if (status === "APPROVED") {
            const item = await db.moduleItem.findUnique({
                where: { id: moduleItemId },
                include: { module: { include: { items: true } } }
            });

            if (item) {
                const moduleId = item.moduleId;
                const moduleItems = item.module.items;

                // Check progress for all items in this module
                const allItemsProgress = await db.moduleItemProgress.findMany({
                    where: {
                        userId,
                        moduleItemId: { in: moduleItems.map(i => i.id) }
                    }
                });

                console.log("DEBUG: Module Items Count:", moduleItems.length);
                console.log("DEBUG: Progress Items Count:", allItemsProgress.length);

                const allCompleted = moduleItems.every(i => {
                    if (i.type === "DOCUMENT") return true;
                    const p = allItemsProgress.find(ap => ap.moduleItemId === i.id);
                    const completed = p?.isCompleted;
                    if (!completed) console.log("DEBUG: Item incomplete:", i.title, i.id);
                    return completed;
                });

                console.log("DEBUG: All Completed?", allCompleted);

                if (allCompleted) {
                    console.log("DEBUG: Marking Module COMPLETED:", moduleId);
                    // Mark module as completed
                    await db.moduleProgress.upsert({
                        where: { userId_moduleId: { userId, moduleId } },
                        update: { status: "COMPLETED", completedAt: new Date() },
                        create: { userId, moduleId, status: "COMPLETED", completedAt: new Date() }
                    });

                    // Unlock next module
                    const nextModule = await db.module.findFirst({
                        where: {
                            courseId: item.module.courseId,
                            order: { gt: item.module.order }
                        },
                        orderBy: { order: "asc" }
                    });

                    if (nextModule) {
                        console.log("DEBUG: Unlocking Next Module:", nextModule.title);
                        await db.moduleProgress.upsert({
                            where: { userId_moduleId: { userId, moduleId: nextModule.id } },
                            update: { status: "IN_PROGRESS" },
                            create: { userId, moduleId: nextModule.id, status: "IN_PROGRESS", startedAt: new Date() }
                        });
                    } else {
                        console.log("DEBUG: No next module found.");
                    }
                }
            }
        }

        return NextResponse.json(updatedProgress);
    } catch (error) {
        console.error("Error evaluating submission:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
