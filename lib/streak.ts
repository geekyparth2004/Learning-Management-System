import { db } from "@/lib/db";
import { checkAndAwardStreakBadges, StreakBadgeType } from "@/lib/badges";

// IST offset: UTC+5:30 = 5.5 hours = 330 minutes
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Get the current date in IST timezone (midnight IST)
 */
function getISTDate(date: Date): Date {
    // Convert to IST by adding offset, then get the date part
    const istTime = new Date(date.getTime() + IST_OFFSET_MS);
    return new Date(Date.UTC(istTime.getUTCFullYear(), istTime.getUTCMonth(), istTime.getUTCDate()));
}

/**
 * Updates user streak when they complete a task.
 * All date comparisons are done in IST timezone.
 * - If last activity was yesterday (IST), increment streak
 * - If last activity was today (IST), do nothing
 * - If last activity was before yesterday (or never), reset to 1
 */
export async function updateUserStreak(userId: string): Promise<{ streak: number; newBadge?: StreakBadgeType | null }> {
    const user = await db.user.findUnique({
        where: { id: userId },
        select: { currentStreak: true, lastActivityDate: true }
    });

    if (!user) {
        return { streak: 0, newBadge: null };
    }

    const now = new Date();
    const todayIST = getISTDate(now);

    let newStreak = 1;

    if (user.lastActivityDate) {
        const lastActivity = new Date(user.lastActivityDate);
        const lastActivityDayIST = getISTDate(lastActivity);

        const diffDays = Math.floor((todayIST.getTime() - lastActivityDayIST.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            // Already active today (IST), don't change streak
            return { streak: user.currentStreak, newBadge: null };
        } else if (diffDays === 1) {
            // Last activity was yesterday (IST), increment streak
            newStreak = user.currentStreak + 1;
        } else {
            // Streak broken, reset to 1
            newStreak = 1;
        }
    }

    await db.user.update({
        where: { id: userId },
        data: {
            currentStreak: newStreak,
            lastActivityDate: now
        }
    });

    // Check for streak badges
    const newBadge = await checkAndAwardStreakBadges(userId, newStreak);

    return { streak: newStreak, newBadge };
}

/**
 * Get user's current streak, checking if it's still valid.
 * All date comparisons are done in IST timezone.
 * If the user missed yesterday (IST), reset streak to 0.
 */
export async function getUserStreak(userId: string): Promise<{ streak: number; lastActivityDate: Date | null }> {
    const user = await db.user.findUnique({
        where: { id: userId },
        select: { currentStreak: true, lastActivityDate: true }
    });

    if (!user) {
        return { streak: 0, lastActivityDate: null };
    }

    const now = new Date();
    const todayIST = getISTDate(now);

    if (user.lastActivityDate) {
        const lastActivity = new Date(user.lastActivityDate);
        const lastActivityDayIST = getISTDate(lastActivity);

        const diffDays = Math.floor((todayIST.getTime() - lastActivityDayIST.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
            // Streak is broken, reset it
            await db.user.update({
                where: { id: userId },
                data: { currentStreak: 0 }
            });
            return { streak: 0, lastActivityDate: user.lastActivityDate };
        }
    }

    return { streak: user.currentStreak, lastActivityDate: user.lastActivityDate };
}

