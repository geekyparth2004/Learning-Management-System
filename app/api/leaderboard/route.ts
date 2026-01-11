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

            // Fetch all users who might have a score (either internal or external)
            // Ideally we'd filter, but to ensure we capture everyone with either internal submissions OR external progress:
            // We'll fetch users active in submissions + users with codolioUsername.

            const submissions = await db.submission.groupBy({
                by: ['userId', 'problemId'],
                where: {
                    status: "PASSED",
                    ...dateFilter,
                    problem: {
                        AND: [
                            { type: { not: "LEETCODE" } },
                            { leetcodeUrl: null }
                        ]
                    }
                },
                _count: { _all: true }
            });

            const internalCounts: Record<string, number> = {};
            submissions.forEach(sub => {
                internalCounts[sub.userId] = (internalCounts[sub.userId] || 0) + 1;
            });

            // Fetch users. 
            // Optimization: Fetch users who have ID in internalCounts OR have codolioUsername not null.
            const userIdsWithInternal = Object.keys(internalCounts);

            const users = await db.user.findMany({
                where: {
                    OR: [
                        { id: { in: userIdsWithInternal } },
                        { codolioUsername: { not: null } }
                    ]
                },
                select: {
                    id: true,
                    name: true,
                    image: true,
                    codolioUsername: true,
                    codolioBaseline: true,
                    externalRatings: true
                }
            });

            const leaderboard = users.map(u => {
                const internal = internalCounts[u.id] || 0;
                let externalDiff = 0;

                // Only count external differential for Lifetime (period not checked for external here based on user request "problem solved card" which usually implies lifetime/total)
                // However, user said "problem solved on external platforms will be counted in problem solved".
                // "Problem Solved" metric is usually Lifetime total.
                // If period is weekly/monthly, technically we should count usage in that period.
                // But external stats from Codolio (cache) gives us Total, Weekly, Monthly.
                // The "Differential" logic is specifically "Current Total - Baseline (at start of feature)".
                // Only Lifetime makes sense for "Differential from Baseline".
                // For Weekly/Monthly, Codolio already provides the exact count for that period!
                // Wait, User said: "dont take previous data... as soon as it changes... difference will be updated".
                // This implies simpler logic: Just add the NEW solves.
                // If I use Codolio's "Weekly" stats directly, does that include "previous data"?
                // Codolio Weekly resets every week. So it is always "new".
                // User's concern "previous data" likely refers to the "Total Questions" count which might be 500 when they start.
                // They don't want to suddenly jump to 528. They want 28 + (500-500) = 28. Then 28 + (501-500) = 29.
                // So for LIFETIME, use differential.
                // For WEEKLY/MONTHLY, use Codolio's direct weekly/monthly stats?
                // The user said "problem solved card" which implies the main counter.
                // Typically "Internal Leaderboard" = "Problems Solved".
                // I will add the *Lifetime Differential* to the score regardless of period?
                // No, if period is weekly, I should use Weekly Internal + Weekly External.
                // Codolio provides `contestStats` (weekly/monthly). Does it provide `questionStats` (weekly/monthly)?
                // `lib/codolio.ts` extracts `totalQuestions`. It does NOT seem to extract weekly question count.
                // Codolio usually only gives Total Questions.
                // So for Weekly/Monthly, I can only rely on Internal stats unless I start interpreting "difference" over time which is complex.
                // RECOMMENDATION: For now, only apply this to LIFETIME "Problems Solved" count.
                // If period != lifetime, I will stick to internal only, or simple aggregation if available.
                // User said "problem solved on the external ... counted in problem solved also".
                // I will assume this applies primarily to the main Lifetime metric.

                if (period === "lifetime" && u.externalRatings && u.codolioBaseline !== null) {
                    const stats = u.externalRatings as any;
                    const currentTotal = stats.totalQuestions || 0;
                    const baseline = u.codolioBaseline || 0;
                    externalDiff = Math.max(0, currentTotal - baseline);
                }

                // If user meant "Weekly" too... impossible without historical tracking. 
                // So I will only apply to Lifetime.

                const totalScore = internal + externalDiff;

                return {
                    id: u.id,
                    name: u.name,
                    image: u.image,
                    score: totalScore,
                    internal,
                    externalDiff
                };
            }).sort((a, b) => b.score - a.score).slice(0, 50);

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
