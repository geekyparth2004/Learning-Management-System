
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { leetcodeUsername: true, codeforcesUsername: true, gfgUsername: true }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        interface PlatformStats {
            leetcode: { totalSolved: number; easySolved: number; mediumSolved: number; hardSolved: number; ranking: number; } | null;
            codeforces: { rating: number; maxRating: number; rank: string; maxRank: string; } | null;
            gfg: { totalSolved: number; codingScore: number; } | null;
        }

        const stats: PlatformStats = {
            leetcode: null,
            codeforces: null,
            gfg: null
        };

        const promises = [];

        // 1. LeetCode
        if (user.leetcodeUsername) {
            promises.push(fetchLeetCodeStats(user.leetcodeUsername).then(data => stats.leetcode = data));
        }

        // 2. Codeforces
        if (user.codeforcesUsername) {
            promises.push(fetchCodeforcesStats(user.codeforcesUsername).then(data => stats.codeforces = data));
        }

        // 3. GeeksforGeeks
        if (user.gfgUsername) {
            promises.push(fetchGFGStats(user.gfgUsername).then(data => stats.gfg = data));
        }

        await Promise.allSettled(promises);

        return NextResponse.json(stats);
    } catch (error) {
        console.error("[EXTERNAL_STATS]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

async function fetchLeetCodeStats(username: string) {
    try {
        const query = `
            query getUserProfile($username: String!) {
                allQuestionsCount {
                    difficulty
                    count
                }
                matchedUser(username: $username) {
                    submitStats {
                        acSubmissionNum {
                            difficulty
                            count
                            submissions
                        }
                    }
                    profile {
                        ranking
                        reputation
                    }
                }
                userContestRanking(username: $username) {
                    attendedContestsCount
                    rating
                    globalRanking
                    totalParticipants
                    topPercentage
                }
            }
        `;

        const response = await fetch("https://leetcode.com/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Referer": "https://leetcode.com"
            },
            body: JSON.stringify({
                query,
                variables: { username }
            })
        });

        const data = await response.json();
        const matched = data?.data?.matchedUser;
        const contestRanking = data?.data?.userContestRanking;

        if (!matched) return null;

        const submissions = matched.submitStats.acSubmissionNum;
        const total = submissions.find((s: any) => s.difficulty === "All")?.count || 0;
        const easy = submissions.find((s: any) => s.difficulty === "Easy")?.count || 0;
        const medium = submissions.find((s: any) => s.difficulty === "Medium")?.count || 0;
        const hard = submissions.find((s: any) => s.difficulty === "Hard")?.count || 0;

        return {
            totalSolved: total,
            easySolved: easy,
            mediumSolved: medium,
            hardSolved: hard,
            ranking: matched.profile?.ranking || 0,
            contest: contestRanking ? {
                attended: contestRanking.attendedContestsCount,
                rating: Math.round(contestRanking.rating),
                globalRanking: contestRanking.globalRanking,
                totalParticipants: contestRanking.totalParticipants,
                topPercentage: contestRanking.topPercentage
            } : null
        };
    } catch (e) {
        console.error("LeetCode Fetch Error", e);
        return null; // Return null on error so UI handles it gracefully
    }
}

async function fetchCodeforcesStats(username: string) {
    try {
        const response = await fetch(`https://codeforces.com/api/user.info?handles=${username}`);
        const data = await response.json();

        if (data.status !== "OK") return null;

        const info = data.result[0];
        return {
            rating: info.rating,
            maxRating: info.maxRating,
            rank: info.rank,
            maxRank: info.maxRank
        };
    } catch (e) {
        console.error("Codeforces Fetch Error", e);
        return null;
    }
}

async function fetchGFGStats(username: string) {
    try {
        const response = await fetch(`https://www.geeksforgeeks.org/user/${username}/`);
        const html = await response.text();
        const $ = cheerio.load(html);

        // Scraping Logic (Fragile, depends on GFG DOM)
        // 1. Overall problem count often in a specific class or container
        // Updated selector logic based on common GFG profile structure

        // Example Selector Strategies (Need to be robust)
        // Usually "Problem Solved" is in a text block, followed by a number.
        // Or specific class names.

        // Strategy: Search for "Problem Solved" text and get next number
        // Or look for specific known classes if available.
        // Assuming: <div class="scoreCard_head_left_score__..."> 123 </div>
        // Let's try text matching as classes change.

        let totalSolved = 0;
        let codingScore = 0;

        // Try getting Coding Score
        const scoreElement = $('.scoreCard_head_left_score__pB2R1'); // This class is likely dynamic/hashed
        // Fallback: search for text "Coding Score" and find sibling

        // Finding "Total Problem Solved"
        // Typically text: "Problem Solved: X"
        // Let's look for element containing "Problem Solved"

        // Generic Text Search
        const textContent = $('body').text();

        // Regex for "Problem Solved: 123"
        const solvedMatch = textContent.match(/Problem Solved:\s*(\d+)/i);
        if (solvedMatch) {
            totalSolved = parseInt(solvedMatch[1]);
        }

        // Regex for "Coding Score: 123"
        const scoreMatch = textContent.match(/Coding Score:\s*(\d+)/i);
        if (scoreMatch) {
            codingScore = parseInt(scoreMatch[1]);
        }

        // Also try specific selectors if regex fails (sometimes separated in DOM)
        if (totalSolved === 0) {
            // Try fetching from specific dashboard elements if identifiable
            // GFG uses React/Next so might be hard.
            // But usually server renders some basic info.
        }

        // If we can't find anything, we might be blocked or structure changed.
        // Return whatever we found.

        return {
            totalSolved,
            codingScore
        };

    } catch (e) {
        console.error("GFG Fetch Error", e);
        return null;
    }
}
