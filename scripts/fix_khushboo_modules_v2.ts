
import dotenv from 'dotenv';
dotenv.config();

import { db } from "../lib/db";
import { checkAndUnlockNextModule } from "../lib/modules";

async function main() {
    const email = "khushboodixit4687@gmail.com";

    const user = await db.user.findUnique({
        where: { email },
        include: { enrollments: true }
    });

    if (!user) {
        console.error(`User not found: ${email}`);
        return;
    }
    console.log(`Found User: ${user.name} (${user.id})`);

    // We need to find the "AI Interview - 1" item in Module "Some more Operators and Switch Statement"
    // Let's find the module first
    const module = await db.module.findFirst({
        where: {
            courseId: user.enrollments[0].courseId, // Assuming first course
            title: "Some more Operators and Switch Statement"
        },
        include: { items: true }
    });

    if (!module) {
        console.error("Module not found");
        return;
    }

    const item = module.items.find(i => i.title === "AI Interview - 1");
    if (!item) {
        console.error("Item 'AI Interview - 1' not found in module");
        return;
    }

    console.log(`Found Target Item: ${item.title} (ID: ${item.id})`);

    // Trigger Unlock Logic
    console.log("Triggering checkAndUnlockNextModule...");
    await checkAndUnlockNextModule(user.id, item.id);
    console.log("Done.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await db.$disconnect());
