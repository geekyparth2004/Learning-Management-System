
import { db } from "@/lib/db";

export async function checkAndUnlockNextModule(userId: string, moduleItemId: string) {
    // 1. Get the item and its module
    const item = await db.moduleItem.findUnique({
        where: { id: moduleItemId },
        include: {
            module: {
                include: {
                    items: {
                        orderBy: { order: "asc" }
                    }
                }
            }
        }
    });

    if (!item) return;

    const moduleId = item.moduleId;
    const moduleItems = item.module.items;

    // 2. Check progress for all items in this module
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

    // 3. If all items completed, mark module as completed and unlock next
    if (allCompleted) {
        // Mark module as completed
        await db.moduleProgress.upsert({
            where: { userId_moduleId: { userId, moduleId } },
            update: { status: "COMPLETED", completedAt: new Date() },
            create: { userId, moduleId, status: "COMPLETED", completedAt: new Date() }
        });

        console.log(`Module ${moduleId} marked as COMPLETED for user ${userId}`);

        // 4. Unlock next module
        const nextModule = await db.module.findFirst({
            where: {
                courseId: item.module.courseId,
                order: { gt: item.module.order }
            },
            orderBy: { order: "asc" }
        });

        if (nextModule) {
            console.log(`Unlocking next module ${nextModule.id} for user ${userId}`);
            await db.moduleProgress.upsert({
                where: { userId_moduleId: { userId, moduleId: nextModule.id } },
                update: { status: "IN_PROGRESS" },
                create: { userId, moduleId: nextModule.id, status: "IN_PROGRESS", startedAt: new Date() }
            });
        }
    } else {
        // FAIL-SAFE: If not all completed, ensure module is at least IN_PROGRESS 
        // (if it wasn't already COMPLETED)
        const currentProgress = await db.moduleProgress.findUnique({
            where: { userId_moduleId: { userId, moduleId } }
        });

        if (!currentProgress || currentProgress.status === "LOCKED") {
            await db.moduleProgress.upsert({
                where: { userId_moduleId: { userId, moduleId } },
                update: { status: "IN_PROGRESS" },
                create: { userId, moduleId, status: "IN_PROGRESS", startedAt: new Date() }
            });
        }
    }
}
