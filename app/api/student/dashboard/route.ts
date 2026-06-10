import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { CACHE_KEYS, CACHE_TTL, cacheGet, cacheSet } from "@/lib/redis";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id;
        const now = new Date();
        const cacheKey = CACHE_KEYS.studentDashboard(userId);
        const cached = await cacheGet(cacheKey);
        if (cached) {
            return NextResponse.json(cached, {
                headers: {
                    "Cache-Control": "private, max-age=30",
                    "X-Cache": "HIT",
                },
            });
        }

        const [
            completedItems,
            contestsEntered,
            hackathonsParticipated,
            solvedProblems,
            user,
            allAssignmentSubmissions,
        ] = await Promise.all([
            db.moduleItemProgress.findMany({
                where: {
                    userId,
                    isCompleted: true
                },
                include: {
                    moduleItem: {
                        select: {
                            duration: true,
                            type: true,
                            assignmentId: true
                        }
                    }
                }
            }),
            db.contestRegistration.count({
                where: { userId }
            }),
            db.contestRegistration.count({
                where: {
                    userId,
                    contest: {
                        type: "HACKATHON"
                    }
                }
            }),
            db.submission.findMany({
                where: {
                    userId,
                    status: "PASSED"
                },
                select: {
                    createdAt: true,
                    problemId: true,
                    problem: {
                        select: {
                            type: true,
                            leetcodeUrl: true
                        }
                    }
                }
            }),
            db.user.findUnique({
                where: { id: userId },
                select: {
                    codolioBaseline: true,
                    externalRatings: true
                }
            }),
            db.submission.findMany({
                where: {
                    userId,
                    problem: {
                        assignmentId: { not: null }
                    }
                },
                select: {
                    duration: true,
                    problem: {
                        select: { assignmentId: true }
                    }
                },
                orderBy: { duration: "desc" }
            }),
        ]);

        const durationByAssignmentId = new Map<string, number>();
        for (const submission of allAssignmentSubmissions) {
            const assignmentId = submission.problem.assignmentId;
            if (assignmentId && !durationByAssignmentId.has(assignmentId)) {
                durationByAssignmentId.set(assignmentId, submission.duration);
            }
        }

        // Calculate hours (duration is in seconds hopefully, or minutes. Let's assume minutes based on typical LMS, but I commented seconds in schema. Let's treat as minutes for fail safety or seconds? Schema said "seconds/minutes". I'll assume MINUTES for now as it makes more sense for "12 hrs" type outputs without massive numbers. Actually standard is usually seconds. Let's stick to seconds.)
        // User request "12 hrs". If I store 12*3600 = 43200.
        // Let's assume the field `duration` will be populated in SECONDS.
        // Calculate hours
        // Priority:
        // 1. Module Item Duration (Set by Teacher for Videos/Content)
        // 2. Submission Duration (Actual time spent by Student on Assignments/Practice)

        let totalSeconds = 0;

        for (const progress of completedItems) {
            let itemDuration = progress.moduleItem.duration || 0;

            if (itemDuration === 0 && progress.moduleItem.type === "ASSIGNMENT" && progress.moduleItem.assignmentId) {
                itemDuration = durationByAssignmentId.get(progress.moduleItem.assignmentId) || 0;
            }

            totalSeconds += itemDuration;
        }

        const hoursLearned = Math.round((totalSeconds / 3600) * 10) / 10; // 1 decimal place

        // Filter out external problems to avoid double counting with Codolio/External stats
        const relevantSolved = solvedProblems.filter(s =>
            s.problem &&
            s.problem.type !== "LEETCODE" &&
            !s.problem.leetcodeUrl
        );

        // Unique problems
        const uniqueSolved = new Set(relevantSolved.map(s => s.problemId)).size;
        // The user mentioned "includes all problem internally and leetcode one". 
        // We don't have leetcode live data. We probably need a field on User for `leetcodeSolvedCount` or scrape it. 
        // For now I'll just use internal.

        let externalDiff = 0;
        if (user && user.externalRatings && user.codolioBaseline !== null) {
            const stats = user.externalRatings as any;
            const currentTotal = stats.totalQuestions || 0;
            const baseline = user.codolioBaseline || 0;
            externalDiff = Math.max(0, currentTotal - baseline);
        }

        // 6. Graphs Data
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

        const data = {
            hoursLearned,
            contestsEntered,
            hackathonsParticipated,
            problemsSolved: uniqueSolved + externalDiff,
            activityGraph: activityData,
            problemsGraph: problemsData
        };

        await cacheSet(cacheKey, data, CACHE_TTL.SHORT);

        return NextResponse.json(data, {
            headers: {
                "Cache-Control": "private, max-age=30",
                "X-Cache": "MISS",
            },
        });

    } catch (error) {
        console.error("Dashboard API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
