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

        if (!data) return null;

        // 1. Total Questions
        const totalQuestions = data.totalQuestionStats?.totalQuestionCounts || 0;

        // 2. Contest Stats Calculation
        const now = Date.now();
        const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
        const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

        let weeklyContests = 0;
        let monthlyContests = 0;
        let lifetimeContests = 0;

        // Parse contest activity
        const contestActivityList = data.contestActivityStats?.contestActivityList || [];

        // Also check if individual platforms have contest lists?
        // The main 'contestActivityStats' seems to aggregate them.
        // We will strictly use the top-level aggregation if available.

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

        if (data.platformProfiles) {
            data.platformProfiles.forEach((profile: any) => {
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
