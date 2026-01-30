import { db } from "@/lib/db";

export const BADGE_DEFINITIONS = {
    PROBLEMS_50: {
        id: "PROBLEMS_50",
        title: "50 Problems Conquered",
        description: "Solved 50 practice problems",
        threshold: 50,
        image: "/badges/badge_50.png"
    },
    PROBLEMS_100: {
        id: "PROBLEMS_100",
        title: "Century Coder",
        description: "Solved 100 practice problems",
        threshold: 100,
        image: "/badges/badge_100.png"
    },
    PROBLEMS_150: {
        id: "PROBLEMS_150",
        title: "Golden Algorithm Master",
        description: "Solved 150 practice problems",
        threshold: 150,
        image: "/badges/badge_150.png"
    },
    PROBLEMS_200: {
        id: "PROBLEMS_200",
        title: "Legendary Problem Slayer",
        description: "Solved 200 practice problems",
        threshold: 200,
        image: "/badges/badge_200.png"
    }
} as const;

export type BadgeType = keyof typeof BADGE_DEFINITIONS;

/**
 * Check if user has earned any new badges based on their problem count.
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

    const earnedBadgeTypes = new Set(existingBadges.map(b => b.badgeType));

    // Check each badge threshold from highest to lowest
    const badgesToCheck: BadgeType[] = ["PROBLEMS_200", "PROBLEMS_150", "PROBLEMS_100", "PROBLEMS_50"];

    for (const badgeType of badgesToCheck) {
        const badge = BADGE_DEFINITIONS[badgeType];

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
 * Get all badges for a user
 */
export async function getUserBadges(userId: string) {
    const userBadges = await db.userBadge.findMany({
        where: { userId },
        orderBy: { earnedAt: 'desc' }
    });

    return userBadges.map(ub => ({
        ...BADGE_DEFINITIONS[ub.badgeType as BadgeType],
        earnedAt: ub.earnedAt
    }));
}
