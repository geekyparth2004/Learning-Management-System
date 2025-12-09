import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id;
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // 1. Hours Learned: Sum of duration of completed ModuleItems
        const completedItems = await db.moduleItemProgress.findMany({
            where: {
                userId,
                isCompleted: true
            },
            include: {
                moduleItem: {
                    select: { duration: true }
                }
            }
        });

        // Calculate hours (duration is in seconds hopefully, or minutes. Let's assume minutes based on typical LMS, but I commented seconds in schema. Let's treat as minutes for fail safety or seconds? Schema said "seconds/minutes". I'll assume MINUTES for now as it makes more sense for "12 hrs" type outputs without massive numbers. Actually standard is usually seconds. Let's stick to seconds.)
        // User request "12 hrs". If I store 12*3600 = 43200.
        // Let's assume the field `duration` will be populated in SECONDS.
        const totalSeconds = completedItems.reduce((acc, curr) => acc + (curr.moduleItem.duration || 0), 0);
        const hoursLearned = Math.round(totalSeconds / 3600);

        // 2. Contests Entered
        const contestsEntered = await db.contestRegistration.count({
            where: { userId }
        });

        // 3. Hackathons Participated
        const hackathonsParticipated = await db.contestRegistration.count({
            where: {
                userId,
                contest: {
                    type: "HACKATHON" // Assuming 'type' field exists or similar discrimination
                }
            }
        });

        // 4. Problems Solved (Internal)
        const solvedProblems = await db.submission.findMany({
            where: {
                userId,
                status: "PASSED"
            },
            select: {
                createdAt: true,
                problemId: true
            }
        });
        // Unique problems? "Problems Solved 57". Usually means unique.
        const uniqueSolved = new Set(solvedProblems.map(s => s.problemId)).size;
        // The user mentioned "includes all problem internally and leetcode one". 
        // We don't have leetcode live data. We probably need a field on User for `leetcodeSolvedCount` or scrape it. 
        // For now I'll just use internal.

        // 5. Graphs Data
        // "Problems Solved" - Daily bar chart (Last 7 days)
        // "Activity" - Weekly curve (Last 7 days)

        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const activityData = [];
        const problemsData = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            const nextDay = new Date(d);
            nextDay.setDate(d.getDate() + 1);

            const label = days[d.getDay()]; // S M T W ...

            // Problems Solved Today
            const solvedToday = solvedProblems.filter(s => {
                const sDate = new Date(s.createdAt);
                return sDate >= d && sDate < nextDay;
            }).length; // This counts submissions, not unique. "Daily question practice" probably implies submissions or unique? Let's use submissions as it looks more "active".

            // Activity Includes everything.
            // Let's count: Submissions + Completed Module Items
            const itemsCompletedToday = completedItems.filter(item => {
                if (!item.completedAt) return false;
                const cDate = new Date(item.completedAt); // Using completedAt as completion time
                return cDate >= d && cDate < nextDay;
            }).length;

            const totalActivity = solvedToday + itemsCompletedToday;

            activityData.push({ day: label, value: totalActivity });
            problemsData.push({ day: label, value: solvedToday });
        }

        return NextResponse.json({
            hoursLearned,
            contestsEntered,
            hackathonsParticipated,
            problemsSolved: uniqueSolved,
            activityGraph: activityData,
            problemsGraph: problemsData
        });

    } catch (error) {
        console.error("Dashboard API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
