import { db } from "@/lib/db";
import { checkAndAwardStreakBadges, StreakBadgeType } from "@/lib/badges";

/**
 * Updates user streak when they complete a task.
 * - If last activity was yesterday, increment streak
 * - If last activity was today, do nothing
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
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let newStreak = 1;

    if (user.lastActivityDate) {
        const lastActivity = new Date(user.lastActivityDate);
        const lastActivityDay = new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate());

        const diffDays = Math.floor((today.getTime() - lastActivityDay.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            // Already active today, don't change streak
            return { streak: user.currentStreak, newBadge: null };
        } else if (diffDays === 1) {
            // Last activity was yesterday, increment streak
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
 * If the user missed yesterday, reset streak to 0.
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
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (user.lastActivityDate) {
        const lastActivity = new Date(user.lastActivityDate);
        const lastActivityDay = new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate());

        const diffDays = Math.floor((today.getTime() - lastActivityDay.getTime()) / (1000 * 60 * 60 * 24));

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
