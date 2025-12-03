import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { problemSlug } = await req.json();

        if (!problemSlug) {
            return NextResponse.json({ error: "Problem slug is required" }, { status: 400 });
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { leetcodeUsername: true },
        });

        if (!user || !user.leetcodeUsername) {
            return NextResponse.json({ error: "LeetCode username not linked" }, { status: 400 });
        }

        // Fetch recent submissions from LeetCode GraphQL API
        const query = `
            query recentAcSubmissions($username: String!, $limit: Int!) {
                recentAcSubmissionList(username: $username, limit: $limit) {
                    titleSlug
                    timestamp
                }
            }
        `;

        const variables = {
            username: user.leetcodeUsername,
            limit: 20,
        };

        const leetcodeRes = await fetch("https://leetcode.com/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Referer": "https://leetcode.com",
            },
            body: JSON.stringify({ query, variables }),
        });

        if (!leetcodeRes.ok) {
            return NextResponse.json({ error: "Failed to fetch LeetCode data" }, { status: 502 });
        }

        const data = await leetcodeRes.json();
        const submissions = data.data?.recentAcSubmissionList || [];

        // Check if the problem was solved recently
        const isSolved = submissions.some((sub: any) => sub.titleSlug === problemSlug);

        if (isSolved) {
            return NextResponse.json({ verified: true });
        } else {
            return NextResponse.json({ verified: false, message: "Submission not found in recent history" });
        }

    } catch (error) {
        console.error("Error verifying LeetCode submission:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
