
import { db } from "@/lib/db";

async function main() {
    const userEmail = "aids22013@gmail.com";

    console.log("Fixing progress for user:", userEmail);
    const user = await db.user.findFirst({
        where: { email: userEmail }
    });

    if (!user) {
        console.log("User not found.");
        return;
    }

    // Find Module 4 specifically "Some more Operators"
    const module4 = await db.module.findFirst({
        where: { title: { contains: "Some more Operators", mode: "insensitive" } },
        include: { items: true }
    });

    if (!module4) {
        console.log("Module not found.");
        return;
    }
    console.log("Found Stuck Module:", module4.title);

    // Force Complete Module 4
    console.log("Marking Module as COMPLETED...");
    await db.moduleProgress.upsert({
        where: { userId_moduleId: { userId: user.id, moduleId: module4.id } },
        update: { status: "COMPLETED", completedAt: new Date() },
        create: { userId: user.id, moduleId: module4.id, status: "COMPLETED", completedAt: new Date() }
    });

    // Find Next Module
    const nextModule = await db.module.findFirst({
        where: {
            courseId: module4.courseId,
            order: { gt: module4.order }
        },
        orderBy: { order: "asc" }
    });

    if (nextModule) {
        console.log("Unlocking Next Module:", nextModule.title);
        await db.moduleProgress.upsert({
            where: { userId_moduleId: { userId: user.id, moduleId: nextModule.id } },
            update: { status: "IN_PROGRESS" },
            create: { userId: user.id, moduleId: nextModule.id, status: "IN_PROGRESS", startedAt: new Date() }
        });
        console.log("SUCCESS: Module Unlocked.");
    } else {
        console.log("No next module found.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await db.$disconnect());
