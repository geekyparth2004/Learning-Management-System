import { db } from "@/lib/db";

// Problem-solving badges
export const PROBLEM_BADGE_DEFINITIONS = {
    PROBLEMS_50: {
        id: "PROBLEMS_50",
        title: "50 Problems Conquered",
        description: "Solved 50 practice problems",
        threshold: 50,
        image: "/badges/badge_50.png",
        category: "problems"
    },
    PROBLEMS_100: {
        id: "PROBLEMS_100",
        title: "Century Coder",
        description: "Solved 100 practice problems",
        threshold: 100,
        image: "/badges/badge_100.png",
        category: "problems"
    },
    PROBLEMS_150: {
        id: "PROBLEMS_150",
        title: "Golden Algorithm Master",
        description: "Solved 150 practice problems",
        threshold: 150,
        image: "/badges/badge_150.png",
        category: "problems"
    },
    PROBLEMS_200: {
        id: "PROBLEMS_200",
        title: "Legendary Problem Slayer",
        description: "Solved 200 practice problems",
        threshold: 200,
        image: "/badges/badge_200.png",
        category: "problems"
    },
    PROBLEMS_300: {
        id: "PROBLEMS_300",
        title: "Ruby Warrior",
        description: "Solved 300 practice problems",
        threshold: 300,
        image: "/badges/badge_300.png",
        category: "problems"
    },
    PROBLEMS_500: {
        id: "PROBLEMS_500",
        title: "Elite Achiever",
        description: "Solved 500 practice problems",
        threshold: 500,
        image: "/badges/badge_500.png",
        category: "problems"
    },
    PROBLEMS_750: {
        id: "PROBLEMS_750",
        title: "Cosmic Champion",
        description: "Solved 750 practice problems",
        threshold: 750,
        image: "/badges/badge_750.png",
        category: "problems"
    },
    PROBLEMS_1000: {
        id: "PROBLEMS_1000",
        title: "Dragon Master",
        description: "Solved 1000 practice problems - Ultimate Achievement!",
        threshold: 1000,
        image: "/badges/badge_1000.png",
        category: "problems"
    },
    PROBLEMS_1500: {
        id: "PROBLEMS_1500",
        title: "Immortal Tier",
        description: "Solved 1500 practice problems - Celestial Power!",
        threshold: 1500,
        image: "/badges/badge_1500.png",
        category: "problems",
        animated: true
    },
    PROBLEMS_2000: {
        id: "PROBLEMS_2000",
        title: "Godlike Tier",
        description: "Solved 2000 practice problems - LEGENDARY!",
        threshold: 2000,
        image: "/badges/badge_2000.png",
        category: "problems",
        animated: true
    }
} as const;

// Streak punctuality badges
export const STREAK_BADGE_DEFINITIONS = {
    STREAK_25: {
        id: "STREAK_25",
        title: "25 Day Warrior",
        description: "Maintained a 25-day streak",
        threshold: 25,
        image: "/badges/badge_streak_25.png",
        category: "streak"
    },
    STREAK_50: {
        id: "STREAK_50",
        title: "50 Day Champion",
        description: "Maintained a 50-day streak",
        threshold: 50,
        image: "/badges/badge_streak_50.png",
        category: "streak"
    },
    STREAK_100: {
        id: "STREAK_100",
        title: "100 Day Phoenix",
        description: "Maintained a 100-day streak",
        threshold: 100,
        image: "/badges/badge_streak_100.png",
        category: "streak"
    },
    STREAK_200: {
        id: "STREAK_200",
        title: "200 Day Legend",
        description: "Maintained a 200-day streak",
        threshold: 200,
        image: "/badges/badge_streak_200.png",
        category: "streak"
    },
    STREAK_365: {
        id: "STREAK_365",
        title: "One Year Master",
        description: "Maintained a 365-day streak - Full year of dedication!",
        threshold: 365,
        image: "/badges/badge_streak_365.png",
        category: "streak"
    }
} as const;

// Combined badge definitions
export const BADGE_DEFINITIONS = {
    ...PROBLEM_BADGE_DEFINITIONS,
    ...STREAK_BADGE_DEFINITIONS
} as const;

export type BadgeType = keyof typeof BADGE_DEFINITIONS;
export type ProblemBadgeType = keyof typeof PROBLEM_BADGE_DEFINITIONS;
export type StreakBadgeType = keyof typeof STREAK_BADGE_DEFINITIONS;

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

