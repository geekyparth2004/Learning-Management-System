import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type") || "internal";
        const period = searchParams.get("period") || "lifetime";

        if (type === "internal") {
            // Internal Problem Solving Leaderboard
            // We need to aggregate Submissions where status = PASSED
            // Prisma groupBy doesn't support complex Date filtering in the same query easily for "last 7 days" 
            // combined with counting.
            // BUT we can use basic where clause.

            let dateFilter = {};
            const now = new Date();
            if (period === "weekly") {
                const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                dateFilter = { createdAt: { gte: oneWeekAgo } };
            } else if (period === "monthly") {
                const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                dateFilter = { createdAt: { gte: oneMonthAgo } };
            }

            // Fetch top users by submission count
            // We want distinct problems solved.
            // Prisma doesn't support "count distinct problemId" in groupBy directly in a simple way 
            // that also joins User.
            // So we might need to fetch raw or grouped data.

            // Efficient approach: Group by userId, count distinct problemId.
            // Note: A user might submit the same problem multiple times.

            const submissions = await db.submission.groupBy({
                by: ['userId', 'questionId'], // Group by user AND problem to get unique solves
                where: {
                    status: "PASSED",
                    ...dateFilter
                },
                _count: {
                    _all: true
                }
            });

            // Now assume each entry is 1 solved problem. Group by userId in memory.
            const userCounts: Record<string, number> = {};
            submissions.forEach(sub => {
                userCounts[sub.userId] = (userCounts[sub.userId] || 0) + 1;
            });

            // Fetch user details for the top IDs
            const sortedUserIds = Object.keys(userCounts).sort((a, b) => userCounts[b] - userCounts[a]).slice(0, 50);

            const users = await db.user.findMany({
                where: { id: { in: sortedUserIds } },
                select: {
                    id: true,
                    name: true,
                    image: true,
                    // leetcodeUsername: true // optional
                }
            });

            const leaderboard = users.map(u => ({
                ...u,
                score: userCounts[u.id]
            })).sort((a, b) => b.score - a.score);

            return NextResponse.json(leaderboard);

        } else {
            // External Leaderboard (Codolio Data)
            // Users are sorted by the cached `externalRatings` JSON field.

            // We can't sort by JSON field efficiently in Prisma/SQL without native queries usually,
            // but for a small user base (<1000), fetching all active users and sorting in memory is fine.
            // For larger scale, we'd promote these stats to real columns.

            const users = await db.user.findMany({
                where: {
                    codolioUsername: { not: null } // Only users with connected profile
                },
                select: {
                    id: true,
                    name: true,
                    image: true,
                    codolioUsername: true,
                    externalRatings: true
                }
            });

            const leaderboard = users.map(u => {
                const stats = u.externalRatings as any;
                let score = 0;

                if (stats && stats.contestStats) {
                    if (period === "weekly") score = stats.contestStats.weekly;
                    else if (period === "monthly") score = stats.contestStats.monthly;
                    else score = stats.contestStats.lifetime;
                }

                return {
                    id: u.id,
                    name: u.name,
                    image: u.image,
                    username: u.codolioUsername,
                    score: score,
                    details: stats
                };
            })
                .sort((a, b) => b.score - a.score)
                .slice(0, 50);

            return NextResponse.json(leaderboard);
        }

    } catch (error) {
        console.error("Leaderboard API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
