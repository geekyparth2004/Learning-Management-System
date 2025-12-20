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
        const { duration, increment, completed } = await req.json(); // Get duration, increment flag, and completed status
        const userId = session.user.id;

        // 1. Mark item as completed & Update Duration
        const updateData: any = {};

        // Only mark as completed if 'completed' is typically true (default) or explicitly true
        // If completed is false (e.g. just saving progress), don't mark isCompleted=true
        if (completed !== false) {
            updateData.isCompleted = true;
            updateData.completedAt = new Date();
        }

        if (duration !== undefined) {
            if (increment) {
                updateData.duration = { increment: parseInt(duration) };
            } else {
                updateData.duration = parseInt(duration);
            }
        }

        await db.moduleItemProgress.upsert({
            where: {
                userId_moduleItemId: {
                    userId,
                    moduleItemId,
                },
            },
            update: updateData,
            create: {
                userId,
                moduleItemId,
                isCompleted: completed !== false, // If creating new, and completed is false, create as incomplete
                completedAt: completed !== false ? new Date() : null,
                duration: duration ? parseInt(duration) : 0
            },
        });

        // 2. Check if module is completed
        const item = await db.moduleItem.findUnique({
            where: { id: moduleItemId },
            include: { module: { include: { items: true } } }
        });

        if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

        const moduleId = item.moduleId;
        const moduleItems = item.module.items;

        // Check progress for all items in this module
        const allItemsProgress = await db.moduleItemProgress.findMany({
            where: {
                userId,
                moduleItemId: { in: moduleItems.map(i => i.id) }
            }
        });

        const allCompleted = moduleItems.every(i => {
            const p = allItemsProgress.find(ap => ap.moduleItemId === i.id);
            return p?.isCompleted;
        });

        if (allCompleted) {
            // Mark module as completed
            await db.moduleProgress.upsert({
                where: { userId_moduleId: { userId, moduleId } },
                update: { status: "COMPLETED", completedAt: new Date() },
                create: { userId, moduleId, status: "COMPLETED", completedAt: new Date() }
            });

            // 3. Unlock next module
            const nextModule = await db.module.findFirst({
                where: {
                    courseId: item.module.courseId,
                    order: { gt: item.module.order }
                },
                orderBy: { order: "asc" }
            });

            if (nextModule) {
                await db.moduleProgress.upsert({
                    where: { userId_moduleId: { userId, moduleId: nextModule.id } },
                    update: { status: "IN_PROGRESS" },
                    create: { userId, moduleId: nextModule.id, status: "IN_PROGRESS", startedAt: new Date() }
                });
            }
        }


        // 4. If Item is a TEST and Completed, Create Submission Records
        if (completed !== false) {
            const testProblems = await db.problem.findMany({
                where: { moduleItemId: moduleItemId } // Fetch problems linked to this item
            });

            if (testProblems.length > 0) {
                // Upsert PASSED submissions for all problems in this test
                await db.$transaction(
                    testProblems.map(p =>
                        db.submission.create({
                            data: {
                                userId,
                                problemId: p.id,
                                code: p.defaultCode || "// Auto-submitted on Test Completion",
                                language: "java", // Default or detect? Java is safe for now.
                                status: "PASSED",
                                duration: 0 // Duration tracked at item level
                            }
                        })
                    )
                );
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error completing item:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
