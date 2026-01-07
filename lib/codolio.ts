export type CodolioStats = {
    totalQuestions: number;
    contestStats: {
        weekly: number;
        monthly: number;
        lifetime: number;
    };
    platforms: {
        leetcode: { rating: number; total: number };
        codechef: { rating: number; total: number };
        codeforces: { rating: number; total: number };
        gfg: { total: number };
    };
    lastUpdated: Date;
};

export async function fetchCodolioStats(username: string): Promise<CodolioStats | null> {
    try {
        const response = await fetch(`https://api.codolio.com/profile?userKey=${username}`, {
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) {
            console.error(`Failed to fetch Codolio profile for ${username}: ${response.status}`);
            return null;
        }

        const json = await response.json();
        const data = json.data;

        // Date calculations for stats
        const now = Date.now();
        const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
        const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

        let totalQuestions = 0;
        let weeklyContests = 0;
        let monthlyContests = 0;
        let lifetimeContests = 0;

        const contestActivityList: any[] = [];

        let profiles = data.platformProfiles;
        if (!Array.isArray(profiles) && profiles?.platformProfiles && Array.isArray(profiles.platformProfiles)) {
            profiles = profiles.platformProfiles;
        }

        // Aggregate from platforms
        if (profiles && Array.isArray(profiles)) {
            profiles.forEach((profile: any) => {
                // 1. Total Questions
                totalQuestions += profile.totalQuestionStats?.totalQuestionCounts || 0;

                // 2. Collect Contests
                if (profile.contestActivityStats?.contestActivityList && Array.isArray(profile.contestActivityStats.contestActivityList)) {
                    contestActivityList.push(...profile.contestActivityStats.contestActivityList);
                }
            });
        }

        // Also check if top-level has them (fallback/merge)
        if (data.totalQuestionStats?.totalQuestionCounts && totalQuestions === 0) {
            totalQuestions = data.totalQuestionStats.totalQuestionCounts;
        }
        if (data.contestActivityStats?.contestActivityList && Array.isArray(data.contestActivityStats.contestActivityList)) {
            // Avoid duplicates if possible, but simpler to just add if we assume they are distinct or use Set.
            // Usually top-level is aggregation of all. If we found platform ones, we might not need this.
            // But let's check if platform extraction yielded 0.
            if (contestActivityList.length === 0) {
                contestActivityList.push(...data.contestActivityStats.contestActivityList);
            }
        }

        // Calculate Contest Stats
        contestActivityList.forEach((contest: any) => {
            // contestDate is in seconds based on sample: 1714876200
            const contestTime = contest.contestDate * 1000;

            lifetimeContests++;
            if (contestTime > oneWeekAgo) weeklyContests++;
            if (contestTime > oneMonthAgo) monthlyContests++;
        });

        // 3. Platform Specifics
        const platforms = {
            leetcode: { rating: 0, total: 0 },
            codechef: { rating: 0, total: 0 },
            codeforces: { rating: 0, total: 0 },
            gfg: { total: 0 }
        };

        if (profiles && Array.isArray(profiles)) {
            profiles.forEach((profile: any) => {
                const name = profile.platform.toLowerCase();
                if (name === 'leetcode') {
                    platforms.leetcode.rating = profile.userStats?.currentRating || 0;
                    platforms.leetcode.total = profile.totalQuestionStats?.totalQuestionCounts || 0;
                } else if (name === 'codechef') {
                    platforms.codechef.rating = profile.userStats?.currentRating || 0;
                    platforms.codechef.total = profile.totalQuestionStats?.totalQuestionCounts || 0;
                } else if (name === 'codeforces') {
                    platforms.codeforces.rating = profile.userStats?.currentRating || 0;
                    platforms.codeforces.total = profile.totalQuestionStats?.totalQuestionCounts || 0;
                } else if (name === 'geeksforgeeks') {
                    platforms.gfg.total = profile.totalQuestionStats?.totalQuestionCounts || 0;
                }
            });
        }

        return {
            totalQuestions,
            contestStats: {
                weekly: weeklyContests,
                monthly: monthlyContests,
                lifetime: lifetimeContests
            },
            platforms,
            lastUpdated: new Date()
        };

    } catch (error) {
        console.error("Error fetching Codolio stats:", error);
        return null;
    }
}
