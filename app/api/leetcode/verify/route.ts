import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { username, slug } = await req.json();

        if (!username || !slug) {
            return NextResponse.json({ error: "Missing username or slug" }, { status: 400 });
        }

        const query = `
            query recentAcSubmissionList($username: String!) {
                recentAcSubmissionList(username: $username, limit: 20) {
                    titleSlug
                    timestamp
                }
            }
        `;

        const response = await fetch("https://leetcode.com/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Referer": "https://leetcode.com",
            },
            body: JSON.stringify({
                query,
                variables: { username }
            })
        });

        const data = await response.json();

        if (data.errors) {
            return NextResponse.json({ success: false, message: "User not found or API error." });
        }

        const submissions = data.data?.recentAcSubmissionList || [];
        const isSolved = submissions.some((sub: any) => sub.titleSlug === slug);

        if (isSolved) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, message: "Problem not found in your recent accepted submissions. Please solve it on LeetCode first." });
        }

    } catch (error) {
        console.error("LeetCode verification error:", error);
        return NextResponse.json({ error: "Verification failed" }, { status: 500 });
    }
}
