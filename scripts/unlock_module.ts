
import { db } from "../lib/db";

async function main() {
    const email = "khushboodixit4687@gmail.com";

    // 1. Find User
    const user = await db.user.findUnique({
        where: { email },
        include: { moduleProgress: { include: { module: true } } }
    });

    if (!user) {
        console.error(`User not found: ${email}`);
        return;
    }
    console.log(`Found User: ${user.name} (${user.id})`);

    // 2. Check Progress
    console.log("Current Progress:");
    user.moduleProgress.sort((a, b) => a.module.order - b.module.order).forEach(p => {
        console.log(`- [Order: ${p.module.order}] ${p.module.title}: ${p.status}`);
    });

    // 3. Unlock Logic
    // Assumption: User wants "Module 3" -> The 3rd module (Order 2) or explicit "Module 3".
    // Let's identify the module with Order 2 ("Some Practice Questions") and Order 3 ("Some more Operators...")

    const targetOrder = 2; // "Module 3" usually means 3rd item if 1-based count. 
    // If user meant "Module 3" as in "3rd chapter", it is Order 2.
    // If user meant "Module 3" as in "Order 3", it is that.

    // Let's find IDs
    const modules = await db.module.findMany({
        where: {
            order: { in: [2, 3] },
            course: { title: "Data Structure and Algorithm with Java" } // Assuming this is the course based on previous list
        }
    });

    const mod2 = modules.find(m => m.order === 2);
    const mod3 = modules.find(m => m.order === 3);

    console.log("Target Candidates:");
    if (mod2) console.log(`Order 2 (3rd Item): ${mod2.title} (${mod2.id})`);
    if (mod3) console.log(`Order 3 (4th Item): ${mod3.title} (${mod3.id})`);

    // UNLOCK BOTH TO BE SAFE (or prefer Mod 2 first, user can request again)
    // Actually, usually when people say "Module 3", they count 1,2,3. So Order 2.
    // I will unlock Order 2 "Some Practice Questions".

    if (mod2) {
        console.log(`Unlocking Order 2: ${mod2.title}`);
        await db.moduleProgress.upsert({
            where: { userId_moduleId: { userId: user.id, moduleId: mod2.id } },
            update: { status: "IN_PROGRESS" },
            create: { userId: user.id, moduleId: mod2.id, status: "IN_PROGRESS", startedAt: new Date() }
        });
    }

    // Checking if Mod 3 (Order 3) should also be unlocked? 
    // If the user meant "Module 3" literally as the number 3.
    // The previous module was "Input and Operators" (Order 1).
    // The next is "Some Practice Questions" (Order 2).
    // The next is "Some more Operators..." (Order 3).

    // I will just unlock Order 2 for now.
}

main()
    .catch(e => console.error(e))
    .finally(async () => await db.$disconnect());
