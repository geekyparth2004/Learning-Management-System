
import { db } from "@/lib/db";

async function main() {
    const userEmail = "aids22013@gmail.com";

    console.log("Searching for user:", userEmail);
    const user = await db.user.findFirst({
        where: { email: userEmail }
    });

    if (!user) {
        console.log("User not found via exact email search.");
        return;
    }
    console.log("Found User:", user.name, user.id);

    // Find Module 4 specifically "Some more Operators"
    console.log("Searching for Module 'Some more Operators'...");
    const module4 = await db.module.findFirst({
        where: { title: { contains: "Some more Operators", mode: "insensitive" } },
        include: { items: true }
    });

    if (!module4) {
        console.log("Module 'Some more Operators' not found.");
        return;
    }
    console.log("Found Module:", module4.title, module4.id, "Items Count:", module4.items.length);

    // Check Items Progress
    console.log("Checking Items Progress...");
    const progress = await db.moduleItemProgress.findMany({
        where: {
            userId: user.id,
            moduleItemId: { in: module4.items.map(i => i.id) }
        }
    });

    let allDone = true;
    for (const item of module4.items) {
        const p = progress.find(prog => prog.moduleItemId === item.id);
        const done = p?.isCompleted;
        console.log(`- Item: ${item.title} (${item.type}) -> Completed: ${done} (Status: ${p?.reviewStatus})`);
        if (!done) allDone = false;
    }

    console.log("---");
    console.log("Calculated ALL DONE:", allDone);

    // Check Module Progress
    const modProgress = await db.moduleProgress.findUnique({
        where: { userId_moduleId: { userId: user.id, moduleId: module4.id } }
    });
    console.log("Module Progress Status in DB:", modProgress?.status);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await db.$disconnect());
