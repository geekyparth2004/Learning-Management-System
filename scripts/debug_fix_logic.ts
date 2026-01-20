
import dotenv from 'dotenv';
dotenv.config();

import { db } from "../lib/db";

async function main() {
    const email = "khushboodixit4687@gmail.com";
    const targetItemId = "cmkm7kxmv000f14lu2fht0h1x"; // AI Interview in Mod 3

    const user = await db.user.findUnique({ where: { email } });
    if (!user) { console.error("User not found"); return; }
    const userId = user.id;

    console.log(`Checking Logic for User ${userId}, Item ${targetItemId}`);

    // LOGIC COPY START
    const item = await db.moduleItem.findUnique({
        where: { id: targetItemId },
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

    if (!item) {
        console.error("Item not found");
        return;
    }

    const moduleId = item.moduleId;
    const moduleItems = item.module.items;
    console.log(`Module ID: ${moduleId}, Title: ${item.module.title}, Item Count: ${moduleItems.length}`);

    const allItemsProgress = await db.moduleItemProgress.findMany({
        where: {
            userId,
            moduleItemId: { in: moduleItems.map(i => i.id) }
        }
    });

    console.log(`Found ${allItemsProgress.length} progress records.`);

    let allCompleted = true;
    moduleItems.forEach(i => {
        const p = allItemsProgress.find(ap => ap.moduleItemId === i.id);
        const isComp = p?.isCompleted;
        console.log(`Item [${i.order}] ${i.title} (${i.id}) - Completed: ${isComp}`);
        if (!isComp) allCompleted = false;
    });

    console.log(`All Completed Result: ${allCompleted}`);

    if (allCompleted) {
        console.log("Marking Module COMPLETED...");
        try {
            const res = await db.moduleProgress.upsert({
                where: { userId_moduleId: { userId, moduleId } },
                update: { status: "COMPLETED", completedAt: new Date() },
                create: { userId, moduleId, status: "COMPLETED", completedAt: new Date() }
            });
            console.log("Module Progress Updated:", res);

            // Unlock next
            const nextModule = await db.module.findFirst({
                where: {
                    courseId: item.module.courseId,
                    order: { gt: item.module.order }
                },
                orderBy: { order: "asc" }
            });

            if (nextModule) {
                console.log(`Next Module Found: ${nextModule.title} (${nextModule.id})`);
                const res2 = await db.moduleProgress.upsert({
                    where: { userId_moduleId: { userId, moduleId: nextModule.id } },
                    update: { status: "IN_PROGRESS" },
                    create: { userId, moduleId: nextModule.id, status: "IN_PROGRESS", startedAt: new Date() }
                });
                console.log("Next Module Unlocked:", res2);
            } else {
                console.log("No next module found.");
            }

        } catch (e) {
            console.error("DB Update Failed:", e);
        }
    } else {
        console.log("Not all items completed. Module remains as is.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await db.$disconnect());
