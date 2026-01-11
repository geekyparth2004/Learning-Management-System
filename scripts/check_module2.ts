
import { db } from "../lib/db";

async function main() {
    const email = "khushboodixit4687@gmail.com";

    const user = await db.user.findUnique({ where: { email } });
    if (!user) { console.error("User not found"); return; }

    // Find Module 2 ("Input and Operators", Order 1)
    const module2 = await db.module.findFirst({
        where: {
            title: "Input and Operators",
            course: { title: "Data Structure and Algorithm with Java" }
        },
        include: { items: true }
    });

    if (!module2) { console.error("Module 2 not found"); return; }

    console.log(`Checking Module: ${module2.title} (${module2.id})`);
    console.log(`Total Items: ${module2.items.length}`);

    // Check Item Progress
    const itemProgress = await db.moduleItemProgress.findMany({
        where: {
            userId: user.id,
            moduleItem: { moduleId: module2.id }
        },
        include: { moduleItem: true }
    });

    let allCompleted = true;

    // Map existing progress
    const progressMap = new Map(itemProgress.map(p => [p.moduleItemId, p]));

    module2.items.sort((a, b) => a.order - b.order).forEach(item => {
        const prog = progressMap.get(item.id);
        const isDone = prog?.isCompleted;
        console.log(`- Item [${item.order}] "${item.title}": ${isDone ? "COMPLETED" : "NOT COMPLETED"}`);
        if (!isDone) allCompleted = false;
    });

    if (allCompleted) {
        console.log("All items are COMPLETED. Updating Module Status...");
        await db.moduleProgress.update({
            where: { userId_moduleId: { userId: user.id, moduleId: module2.id } },
            data: { status: "COMPLETED", completedAt: new Date() }
        });
        console.log("Module 2 marked as COMPLETED.");
    } else {
        console.log("Module 2 has incomplete items. Cannot auto-complete.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await db.$disconnect());
