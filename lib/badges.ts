import { db } from "@/lib/db";
import {
    BADGE_DEFINITIONS,
    PROBLEM_BADGE_DEFINITIONS,
    STREAK_BADGE_DEFINITIONS,
    BadgeType,
    ProblemBadgeType,
    StreakBadgeType,
    CourseBadgeType
} from "./badge-definitions";


/**
 * Check if user has earned any new problem badges based on their problem count.
 * Returns the newly earned badge if any.
 */
export async function checkAndAwardBadges(userId: string): Promise<BadgeType | null> {
    // Count unique passed problems for this user
    const passedProblems = await db.submission.groupBy({
        by: ['problemId'],
        where: {
            userId,
            status: "PASSED"
        }
    });

    const solvedCount = passedProblems.length;

    // Get existing badges
    const existingBadges = await db.userBadge.findMany({
        where: { userId },
        select: { badgeType: true }
    });

    const earnedBadgeTypes = new Set(existingBadges.map((b: { badgeType: string }) => b.badgeType));

    // Check each badge threshold from highest to lowest
    const badgesToCheck: ProblemBadgeType[] = ["PROBLEMS_2000", "PROBLEMS_1500", "PROBLEMS_1000", "PROBLEMS_750", "PROBLEMS_500", "PROBLEMS_300", "PROBLEMS_200", "PROBLEMS_150", "PROBLEMS_100", "PROBLEMS_50"];

    for (const badgeType of badgesToCheck) {
        const badge = PROBLEM_BADGE_DEFINITIONS[badgeType];

        if (solvedCount >= badge.threshold && !earnedBadgeTypes.has(badgeType)) {
            // Award this badge
            await db.userBadge.create({
                data: {
                    userId,
                    badgeType
                }
            });
            return badgeType;
        }
    }

    return null;
}

/**
 * Check if user has earned any new streak badges based on their current streak.
 * Returns the newly earned badge if any.
 */
export async function checkAndAwardStreakBadges(userId: string, currentStreak: number): Promise<StreakBadgeType | null> {
    // Get existing badges
    const existingBadges = await db.userBadge.findMany({
        where: { userId },
        select: { badgeType: true }
    });

    const earnedBadgeTypes = new Set(existingBadges.map((b: { badgeType: string }) => b.badgeType));

    // Check each streak badge threshold from highest to lowest (return highest new badge)
    const streakBadgesToCheck: StreakBadgeType[] = ["STREAK_365", "STREAK_200", "STREAK_100", "STREAK_50", "STREAK_25"];

    for (const badgeType of streakBadgesToCheck) {
        const badge = STREAK_BADGE_DEFINITIONS[badgeType];

        if (currentStreak >= badge.threshold && !earnedBadgeTypes.has(badgeType)) {
            // Award this badge
            await db.userBadge.create({
                data: {
                    userId,
                    badgeType
                }
            });
            return badgeType;
        }
    }

    return null;
}

/**
 * Get all badges for a user
 */
export async function getUserBadges(userId: string) {
    const userBadges = await db.userBadge.findMany({
        where: { userId },
        orderBy: { earnedAt: 'desc' }
    });

    return userBadges.map((ub: { badgeType: string; earnedAt: Date }) => ({
        ...BADGE_DEFINITIONS[ub.badgeType as BadgeType],
        earnedAt: ub.earnedAt
    }));
}

