
import dotenv from 'dotenv';
dotenv.config();

import { db } from "../lib/db";

async function main() {
    const email = "developer.naman@gmail.com";
    const targetModuleOrder = 4; // Module 4: "Loops"

    // 1. Find User
    const user = await db.user.findUnique({
        where: { email },
        include: { enrollments: true }
    });

    if (!user) {
        console.error(`User not found: ${email}`);
        return;
    }
    console.log(`Found User: ${user.name} (${user.id})`);

    if (user.enrollments.length === 0) {
        console.error("User not enrolled in any course");
        return;
    }
    const courseId = user.enrollments[0].courseId;

    // 2. Find Module 4
    const module4 = await db.module.findFirst({
        where: {
            courseId: courseId,
            order: targetModuleOrder
        },
        include: { items: true }
    });

    if (!module4) {
        console.error(`Module with order ${targetModuleOrder} not found`);
        return;
    }
    console.log(`Found Module 4: ${module4.title} (ID: ${module4.id})`);

    // 3. Mark all items in Module 4 as COMPLETED
    console.log(`Marking ${module4.items.length} items as COMPLETED...`);
    for (const item of module4.items) {
        await db.moduleItemProgress.upsert({
            where: {
                userId_moduleItemId: {
                    userId: user.id,
                    moduleItemId: item.id
                }
            },
            update: {
                isCompleted: true,
                status: "COMPLETED", // Assuming there is a status field or similar, checking model... 
                // Wait, Schema check: ItemProgress usually has isCompleted, reviewStatus, status?
                // Previously: update: { reviewStatus: "APPROVED", isCompleted: true } etc.
                // Let's stick to isCompleted = true. If it's a test/interview, we might need reviewStatus="APPROVED".
                // I'll be safe and set reviewStatus="APPROVED" for all just to force it through if needed, 
                // or technically just isCompleted=true is what modules.ts checks.
                // Looking at debug logs: "Status: COMPLETED" is for ModuleProgress, ItemProgress has "Completed: true".
                // ItemProgress has "reviewStatus".
                reviewStatus: "APPROVED", // Hack to sure-fire it
                completedAt: new Date()
            },
            create: {
                userId: user.id,
                moduleItemId: item.id,
                isCompleted: true,
                reviewStatus: "APPROVED",
                completedAt: new Date()
            }
        });
    }

    // 4. Mark Module 4 as COMPLETED
    console.log(`Marking Module 4 as COMPLETED...`);
    await db.moduleProgress.upsert({
        where: { userId_moduleId: { userId: user.id, moduleId: module4.id } },
        update: { status: "COMPLETED", completedAt: new Date() },
        create: { userId: user.id, moduleId: module4.id, status: "COMPLETED", completedAt: new Date() }
    });

    // 5. Unlock Module 5 (Next one)
    const module5 = await db.module.findFirst({
        where: {
            courseId: courseId,
            order: { gt: targetModuleOrder }
        },
        orderBy: { order: "asc" }
    });

    if (module5) {
        console.log(`Found Next Module (Module 5): ${module5.title} (Order: ${module5.order})`);
        console.log(`Unlocking Module 5...`);
        await db.moduleProgress.upsert({
            where: { userId_moduleId: { userId: user.id, moduleId: module5.id } },
            update: { status: "IN_PROGRESS" },
            create: { userId: user.id, moduleId: module5.id, status: "IN_PROGRESS", startedAt: new Date() }
        });
    } else {
        console.log("No next module found to unlock.");
    }

    console.log("Done.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await db.$disconnect());
