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

        const { id } = await params;
        const userId = session.user.id;

        // 1. Mark item as completed
        // Check if progress exists
        const existingProgress = await db.moduleItemProgress.findUnique({
            where: { userId_moduleItemId: { userId, moduleItemId: id } },
        });

        if (!existingProgress) {
            await db.moduleItemProgress.create({
                data: {
                    userId,
                    moduleItemId: id,
                    isCompleted: true,
                    completedAt: new Date(),
                },
            });
        } else if (!existingProgress.isCompleted) {
            await db.moduleItemProgress.update({
                where: { id: existingProgress.id },
                data: { isCompleted: true, completedAt: new Date() },
            });
        }

        // 2. Check Module Completion
        const item = await db.moduleItem.findUnique({
            where: { id },
            include: { module: { include: { items: true } } },
        });

        if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

        const module = item.module;
        const allItems = module.items;

        // Fetch all progress for this module
        const allProgress = await db.moduleItemProgress.findMany({
            where: {
                userId,
                moduleItemId: { in: allItems.map(i => i.id) },
            },
        });

        const allCompleted = allItems.every(i =>
            allProgress.some(p => p.moduleItemId === i.id && p.isCompleted)
        );

        if (allCompleted) {
            // Mark module as completed
            await db.moduleProgress.update({
                where: { userId_moduleId: { userId, moduleId: module.id } },
                data: { status: "COMPLETED", completedAt: new Date() },
            });

            // 3. Unlock Next Module
            const nextModule = await db.module.findFirst({
                where: {
                    courseId: module.courseId,
                    order: { gt: module.order },
                },
                orderBy: { order: "asc" },
            });

            if (nextModule) {
                // Check if already exists (shouldn't, but safety first)
                const nextProgress = await db.moduleProgress.findUnique({
                    where: { userId_moduleId: { userId, moduleId: nextModule.id } },
                });

                if (!nextProgress) {
                    await db.moduleProgress.create({
                        data: {
                            userId,
                            moduleId: nextModule.id,
                            status: "IN_PROGRESS", // Unlocked, waiting for start
                        },
                    });
                }
            } else {
                // Course Completed?
                await db.enrollment.update({
                    where: { userId_courseId: { userId, courseId: module.courseId } },
                    data: { status: "COMPLETED" },
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error completing item:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
