import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// IST offset: UTC+5:30 = 5.5 hours = 330 minutes
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function getISTDate(date: Date): Date {
    const istTime = new Date(date.getTime() + IST_OFFSET_MS);
    return new Date(Date.UTC(istTime.getUTCFullYear(), istTime.getUTCMonth(), istTime.getUTCDate()));
}

function calculateStreakDiff(currentDate: Date, lastActivity: Date) {
    const todayIST = getISTDate(currentDate);
    const lastActivityDayIST = getISTDate(lastActivity);
    const diffMs = todayIST.getTime() - lastActivityDayIST.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    console.log(`Current (IST Sim): ${todayIST.toISOString()}`);
    console.log(`Last (IST Sim):    ${lastActivityDayIST.toISOString()}`);
    console.log(`Diff ms: ${diffMs}`);
    console.log(`Diff days: ${diffDays}`);
    return diffDays;
}

async function main() {
    // 1. Check specific user data
    const email = "akshatjain251007@gmail.com";
    const user = await db.user.findUnique({
        where: { email },
        select: { id: true, currentStreak: true, lastActivityDate: true }
    });

    console.log("=== User Data ===");
    console.log(user);

    if (user?.lastActivityDate) {
        console.log("\n=== Checking against Login Time (Now) ===");
        const now = new Date(); // Current system time
        console.log(`Now: ${now.toISOString()}`);
        console.log(`User Last Activity: ${user.lastActivityDate.toISOString()}`);

        calculateStreakDiff(now, user.lastActivityDate);
    }

    // 2. Simulation Tests
    console.log("\n=== Simulations ===");

    // Test Case A: Activity Yesterday 11 PM, Now Today 12:30 AM (Just crossed midnight)
    // IST Midnight is the boundary.
    // Yesterday 11 PM IST = 17:30 UTC
    // Today 00:30 AM IST = 19:00 UTC

    // Wait, 11 PM IST is 23:00 IST. UTC is 23:00 - 05:30 = 17:30.
    const simLast = new Date("2026-02-13T17:30:00Z"); // Feb 13, 23:00 IST
    const simNow = new Date("2026-02-13T19:06:12Z");  // Feb 14, 00:36 IST (User's current time roughly)

    console.log("Test A: Late night yesterday vs Early morning today");
    console.log(`Last (UTC): ${simLast.toISOString()} -> IST approx Feb 13 23:00`);
    console.log(`Now (UTC):  ${simNow.toISOString()} -> IST approx Feb 14 00:36`);
    calculateStreakDiff(simNow, simLast);

    await db.$disconnect();
}

main();
