import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { BADGE_DEFINITIONS, BadgeType } from "@/lib/badges";

export async function GET() {
    try {
        const userId = "cmipqlrfe000awpjht3jytlhs";

        const passedProblems = await db.submission.groupBy({
            by: ['problemId'],
            where: {
                userId,
                status: "PASSED"
            }
        });

        const solvedCount = passedProblems.length;

        const existingBadges = await db.userBadge.findMany({
            where: { userId },
            select: { badgeType: true }
        });

        const earnedBadgeTypes = new Set(existingBadges.map((b: { badgeType: string }) => b.badgeType));

        const badgesToCheck: BadgeType[] = ["PROBLEMS_50", "PROBLEMS_100", "PROBLEMS_150", "PROBLEMS_200"];
        const newlyEarnedBadges: BadgeType[] = [];

        for (const badgeType of badgesToCheck) {
            const badge = BADGE_DEFINITIONS[badgeType];

            if (badge && solvedCount >= badge.threshold && !earnedBadgeTypes.has(badgeType)) {
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
                newlyEarnedBadges.push("HTML_COMPLETION" as BadgeType);
            }
        }

        const highestNewBadge = newlyEarnedBadges.length > 0
            ? newlyEarnedBadges[newlyEarnedBadges.length - 1]
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
