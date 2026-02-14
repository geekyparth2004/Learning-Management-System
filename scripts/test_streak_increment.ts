import { db } from "@/lib/db";
import { updateUserStreak } from "@/lib/streak";
import { cacheDelete, CACHE_KEYS } from "@/lib/redis";
import { writeFileSync } from "fs";
import { config } from "dotenv";

// Load .env.local
config({ path: ".env.local" });

// Mock env if needed, but tsx usually picks up .env if configured or relies on system env.
// For now assuming db connection works as per previous scripts.

async function main() {
    const email = "akshatjain251007@gmail.com";

    console.log("=== Setting up Test State ===");

    // 1. Set user to: Streak 1, Last Activity = Yesterday (Feb 13, 2026, 12:00 PM IST)
    // Yesterday IST 12:00 PM = UTC 6:30 AM (Feb 13)
    const yesterday = new Date("2026-02-13T06:30:00Z");

    await db.user.update({
        where: { email },
        data: {
            currentStreak: 1,
            lastActivityDate: yesterday
        }
    });

    // Invalidate cache to be sure
    const user = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (user) await cacheDelete(CACHE_KEYS.userStreak(user.id));

    console.log(`User reset to: Streak 1, LastActivity: ${yesterday.toISOString()}`);

    // 2. Run updateUserStreak (simulating activity NOW - Feb 14)
    if (!user) throw new Error("User not found");

    console.log("\n=== Running updateUserStreak ===");
    const result = await updateUserStreak(user.id);

    const output = `Result: ${JSON.stringify(result, null, 2)}\n`;
    console.log(output);
    writeFileSync("scripts/streak_test_output.json", output);

    if (result.streak === 2) {
        console.log("SUCCESS: Streak incremented to 2");
        writeFileSync("scripts/streak_test_result.txt", "SUCCESS");
    } else {
        console.log(`FAILURE: Streak is ${result.streak} (Expected 2)`);
        writeFileSync("scripts/streak_test_result.txt", `FAILURE: ${result.streak}`);
    }

    await db.$disconnect();
}

main().catch(console.error);
