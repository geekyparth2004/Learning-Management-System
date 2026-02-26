import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { BADGE_DEFINITIONS, BadgeType } from "@/lib/badges";

/**
 * Check and award all pending badges for a user on login.
 * Returns all newly earned badges.
 */
export async function POST() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // Count unique passed problems
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

        // Check all badges and award any that are deserved but not yet earned
        const badgesToCheck: BadgeType[] = ["PROBLEMS_50", "PROBLEMS_100", "PROBLEMS_150", "PROBLEMS_200"];
        const newlyEarnedBadges: BadgeType[] = [];

        for (const badgeType of badgesToCheck) {
            const badge = BADGE_DEFINITIONS[badgeType];

            if (badge && solvedCount >= badge.threshold && !earnedBadgeTypes.has(badgeType)) {
                // Award this badge
                await db.userBadge.create({
                    data: {
                        userId,
                        badgeType
                    }
                });
                newlyEarnedBadges.push(badgeType);
            }
        }

        // Check for course badges (HTML_COMPLETION)
        if (!earnedBadgeTypes.has("HTML_COMPLETION")) {
            const hasCompletedHTML = await db.moduleProgress.findUnique({
                where: {
                    userId_moduleId: {
                        userId,
                        moduleId: "cmll8lo3d001d4fzxib3kez4j",
                    },
                },
            });

            if (hasCompletedHTML?.status === "COMPLETED") {
                await db.userBadge.create({
                    data: {
                        userId,
                        badgeType: "HTML_COMPLETION",
                    },
                });
                newlyEarnedBadges.push("HTML_COMPLETION" as BadgeType);
            }
        }

        // Return the highest tier badge that was newly earned (for celebration)
        // Badges are ordered from highest to lowest, so first match is highest
        const highestNewBadge = newlyEarnedBadges.length > 0
            ? newlyEarnedBadges[newlyEarnedBadges.length - 1] // Last one is highest since we check low to high
            : null;

        return NextResponse.json({
            newlyEarnedBadges,
            celebrateBadge: highestNewBadge,
            solvedCount
        });
    } catch (error) {
        console.error("Error checking badges:", error);
        return NextResponse.json({ error: "Failed to check badges" }, { status: 500 });
    }
}
