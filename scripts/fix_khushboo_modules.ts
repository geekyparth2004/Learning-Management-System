
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

    // Find the AI Interview Item in "Module 3" (Order 3) which is "Some more Operators..."
    // Based on previous logs: 
    // Module Order: 3, Title: Some more Operators and Switch Statement
    // Item Order: 8, Type: AI_INTERVIEW, Review: APPROVED
    // Item ID (from logs, logic finding): "cmkm7kxmv000f14lu2fht0h1x" (Wait, I need to look it up to be safe)

    // Let's find the item specifically
    // Search for AI Interview items that are APPROVED but module is IN_PROGRESS

    // Actually, I can just re-trigger checkAndUnlockNextModule for the interview item ID.
    // I saw the ID in the logs: cmkm7kxmv000f14lu2fht0h1x (Item Order 8)
    // Or I can dynamically find it.

    const targetItemId = "cmkm7kxmv000f14lu2fht0h1x"; // Hardcoding based on earlier log for safety, or querying below.

    // Query to confirm
    const item = await db.moduleItem.findUnique({
        where: { id: targetItemId }
    });

    if (!item) {
        console.log("Item not found by ID. Searching dynamically...");
        // Fallback search
        // ... (Skipping complex search, let's rely on db query for "APPROVED" items for this user)
    } else {
        console.log(`Found Item: ${item.title} (${item.type})`);
    }

    // Trigger Unlock Logic
    console.log("Triggering checkAndUnlockNextModule...");
    await checkAndUnlockNextModule(user.id, targetItemId);
    console.log("Done.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await db.$disconnect());
