
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
            select: { leetcodeUsername: true }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        interface PlatformStats {
            leetcode: { totalSolved: number; easySolved: number; mediumSolved: number; hardSolved: number; ranking: number; } | null;
        }

        const stats: PlatformStats = {
            leetcode: null
        };

        const promises = [];

        // 1. LeetCode
        if (user.leetcodeUsername) {
            promises.push(fetchLeetCodeStats(user.leetcodeUsername).then(data => stats.leetcode = data));
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

