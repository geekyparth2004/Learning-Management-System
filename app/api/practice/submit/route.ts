import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await req.json();
        const { problemId, code, language, passed } = data;

        if (!problemId) {
            return NextResponse.json({ error: "Problem ID required" }, { status: 400 });
        }

        const userId = session.user.id;

        // 1. Fetch User and Check Monthly Reset
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { id: true, walletBalance: true, lastWalletReset: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const now = new Date();
        const lastReset = new Date(user.lastWalletReset);
        let currentBalance = user.walletBalance;

        // Check if we are in a new month compared to last reset
        if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
            currentBalance = 0;
            // Update reset date
            await db.user.update({
                where: { id: userId },
                data: {
                    walletBalance: 0,
                    lastWalletReset: now
                }
            });
        }

        // 2. Record Submission
        // We always record the submission attempt history
        await db.submission.create({
            data: {
                userId,
                problemId,
                code: code || "",
                language: language || "unknown",
                status: passed ? "PASSED" : "FAILED"
            }
        });

        let rewarded = false;

        // 3. Reward Logic (Only if passed)
        if (passed) {
            // Check if ALREADY solved before this specific submission
            // We search for ANY *previous* passed submission for this problem
            // explicitly excluding the one we just created? No, easier to just check exists count > 1 or check before create.
            // Let's check count of passed submissions.

            const passedCount = await db.submission.count({
                where: {
                    userId,
                    problemId,
                    status: "PASSED"
                }
            });

            // If passedCount is 1, it means this is the FIRST success (the one we just added).
            // If > 1, they solved it before.
            // Actually, concurrency might be an issue, but for this scale valid.
            // Better: Check `passedCount === 1` (since we just inserted one).

            // Wait, I inserted above. So if it was 0 before, now it is 1.
            // If it was 1 before (solved), now it is 2.
            // So if `passedCount === 1`, apply reward.

            if (passedCount === 1) {
                currentBalance += 5;
                await db.user.update({
                    where: { id: userId },
                    data: { walletBalance: currentBalance }
                });
                rewarded = true;
            }
        }

        return NextResponse.json({
            success: true,
            walletBalance: currentBalance,
            rewarded
        });

    } catch (error) {
        console.error("Error submitting practice:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
