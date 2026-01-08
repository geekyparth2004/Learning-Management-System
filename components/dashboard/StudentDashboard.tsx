import React from "react";
import { db } from "@/lib/db";
import StatCard from "@/components/dashboard/StatCard";
import ActivityGraph from "@/components/dashboard/ActivityGraph";
import ProblemsGraph from "@/components/dashboard/ProblemsGraph";
import HoursStatCard from "@/components/dashboard/HoursStatCard";
import RecentActivityList from "@/components/dashboard/RecentActivityList";
import ExternalStatsCard from "@/components/dashboard/ExternalStatsCard";

interface StudentDashboardProps {
    userId: string;
}

export default async function StudentDashboard({ userId }: StudentDashboardProps) {
    const now = new Date();

    // 1. Fetch Module Progress (Completed + In-Progress)
    const moduleProgressItems = await db.moduleItemProgress.findMany({
        where: { userId },
        include: { moduleItem: { select: { duration: true, title: true } } }
    });

    // 1.1 Fetch User Platforms & Codolio Stats
    const user = await db.user.findUnique({
        where: { id: userId },
        select: {
            leetcodeUsername: true,
            codeforcesUsername: true,
            gfgUsername: true,
            codolioBaseline: true,
            externalRatings: true
        }
    });

    const moduleSeconds = moduleProgressItems.reduce((acc, curr) => {
        if (curr.isCompleted) {
            return acc + (curr.duration || curr.moduleItem.duration || 0);
        }
        return acc + (curr.duration || 0);
    }, 0);

    // 2. Fetch Contests & Hackathons Stats (Only Started)
    const contestsEntered = await db.contestRegistration.count({
        where: {
            userId,
            startedAt: { not: null },
            contest: { category: "CONTEST" }
        }
    });
    const hackathonsParticipated = await db.contestRegistration.count({
        where: {
            userId,
            startedAt: { not: null },
            contest: { category: "HACKATHON" }
        }
    });

    // 3. Fetch Solved Problems (and duration)
    const solvedProblems = await db.submission.findMany({
        where: { userId, status: "PASSED" },
        select: { createdAt: true, problemId: true, duration: true }
    });

    let uniqueSolved = new Set(solvedProblems.map(s => s.problemId)).size;

    // Add Differential External Stats
    if (user?.externalRatings && user.codolioBaseline !== null) {
        const stats = user.externalRatings as any;
        const currentTotal = stats.totalQuestions || 0;
        const baseline = user.codolioBaseline || 0;
        const diff = Math.max(0, currentTotal - baseline);
        uniqueSolved += diff;
    }

    const practiceSeconds = solvedProblems.reduce((acc, curr) => acc + (curr.duration || 0), 0);

    // 4. Fetch Completed Contests Duration
    const completedContests = await db.contestRegistration.findMany({
        where: { userId, startedAt: { not: null }, completedAt: { not: null } },
        select: { startedAt: true, completedAt: true }
    });
    const contestSeconds = completedContests.reduce((acc, curr) => {
        if (curr.completedAt && curr.startedAt) {
            return acc + (curr.completedAt.getTime() - curr.startedAt.getTime()) / 1000;
        }
        return acc;
    }, 0);

    // 4.1 Fetch Nearest Contest & Hackathon for Live/Upcoming Status
    const nextContest = await db.contest.findFirst({
        where: {
            category: "CONTEST",
            endTime: { gt: now }
        },
        orderBy: { startTime: 'asc' }
    });

    const nextHackathon = await db.contest.findFirst({
        where: {
            category: "HACKATHON",
            endTime: { gt: now }
        },
        orderBy: { startTime: 'asc' }
    });

    const getCardStyle = (contest: typeof nextContest) => {
        if (!contest) return "";
        const start = new Date(contest.startTime);
        const end = new Date(contest.endTime);
        const diff = start.getTime() - now.getTime();
        const oneHour = 60 * 60 * 1000;

        // Live: Red Animation
        if (now >= start && now <= end) {
            return "border-red-500 bg-red-900/10 animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.3)]";
        }
        // Upcoming (within 2 hours): Yellow
        if (diff > 0 && diff <= 2 * oneHour) {
            return "border-yellow-500 bg-yellow-900/20";
        }
        // Upcoming (within 24 hours): Blue
        if (diff > 2 * oneHour && diff <= 24 * oneHour) {
            return "border-blue-500 bg-blue-900/20";
        }
        return "";
    };

    // Calculate Total Hours Learned
    const grandTotalSeconds = moduleSeconds + practiceSeconds + contestSeconds;
    const rawHours = grandTotalSeconds / 3600;
    const hoursLearned = rawHours < 100 ? rawHours.toFixed(1) : Math.round(rawHours);

    // 5. Calculate "Today's" Stats (Strict IST Midnight)
    const options: Intl.DateTimeFormatOptions = { timeZone: "Asia/Kolkata", year: 'numeric', month: '2-digit', day: '2-digit' };
    const istDateFormatter = new Intl.DateTimeFormat('en-US', options);
    const parts = istDateFormatter.formatToParts(now);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;

    const todayStart = new Date(`${year}-${month}-${day}T00:00:00+05:30`);

    // Modules Today
    const todayItems = moduleProgressItems.filter(item => {
        if (!item.completedAt) return false;
        return new Date(item.completedAt) >= todayStart;
    });
    const todayModuleSeconds = todayItems.reduce((acc, curr) => {
        if (curr.isCompleted) {
            return acc + (curr.duration || curr.moduleItem.duration || 0);
        }
        return acc + (curr.duration || 0);
    }, 0);

    // Practice Today
    const todayPracticeSeconds = solvedProblems.filter(s => {
        const sDate = new Date(s.createdAt);
        return sDate >= todayStart;
    }).reduce((acc, curr) => acc + (curr.duration || 0), 0);

    // Contests Today
    const todayContestSeconds = completedContests.filter(c => {
        const cDate = new Date(c.completedAt!);
        return cDate >= todayStart;
    }).reduce((acc, curr) => {
        return acc + (curr.completedAt!.getTime() - curr.startedAt!.getTime()) / 1000;
    }, 0);

    const grandTotalTodaySeconds = todayModuleSeconds + todayPracticeSeconds + todayContestSeconds;
    const hoursToday = (grandTotalTodaySeconds / 3600).toFixed(1);

    // 6. Graphs Data
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const activityData = [];
    const problemsData = [];

    // Derive 7 days based on IST
    const istNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

    for (let i = 6; i >= 0; i--) {
        const d = new Date(istNow);
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);

        const currentDayIST = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
        currentDayIST.setDate(currentDayIST.getDate() - i);
        currentDayIST.setUTCHours(0, 0, 0, 0);

        const startRange = new Date(currentDayIST.getTime() - (5.5 * 60 * 60 * 1000));
        const endRange = new Date(startRange.getTime() + (24 * 60 * 60 * 1000));

        const labelDate = new Date(startRange.getTime() + (5.5 * 60 * 60 * 1000));
        const dayLabel = days[labelDate.getUTCDay()];

        const solvedToday = solvedProblems.filter(s => {
            const sDate = new Date(s.createdAt);
            return sDate >= startRange && sDate < endRange;
        }).length;

        const itemsCompletedToday = moduleProgressItems.filter(item => {
            if (!item.completedAt || !item.isCompleted) return false;
            const cDate = new Date(item.completedAt);
            return cDate >= startRange && cDate < endRange;
        }).length;

        activityData.push({ day: dayLabel, value: solvedToday + itemsCompletedToday });
        problemsData.push({ day: dayLabel, value: solvedToday });
    }

    // 7. Recent Activity (Top 5 for Today)
    const recentModules: any[] = moduleProgressItems
        .filter(i => i.isCompleted && i.completedAt && new Date(i.completedAt) >= todayStart)
        .map(i => ({
            id: i.id,
            type: "MODULE_ITEM",
            title: i.moduleItem.title,
            date: new Date(i.completedAt!)
        }));

    const recentSolved = await db.submission.findMany({
        where: {
            userId,
            status: "PASSED",
            createdAt: { gte: todayStart }
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { problem: { select: { title: true } } }
    });
    const recentSolvedMapped = recentSolved.map(s => ({
        id: s.id,
        type: "SUBMISSION",
        title: `Solved: ${s.problem.title} `,
        date: s.createdAt
    }));

    const recentContests = await db.contestRegistration.findMany({
        where: {
            userId,
            joinedAt: { gte: todayStart }
        },
        orderBy: { joinedAt: "desc" },
        take: 5,
        include: { contest: { select: { title: true } } }
    });
    const recentContestsMapped = recentContests.map(c => ({
        id: c.id,
        type: "CONTEST",
        title: `Joined: ${c.contest.title} `,
        date: c.joinedAt
    }));

    // Combine and Sort
    // @ts-ignore - types mixed for recent activity is fine for now
    const allActivity = [...recentModules, ...recentSolvedMapped, ...recentContestsMapped]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 5);


    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Column 1 */}
                <div className="flex flex-col gap-6">
                    <HoursStatCard
                        totalHours={hoursLearned}
                        todayHours={hoursToday}
                    />
                    <ProblemsGraph
                        data={problemsData}
                        totalSolved={uniqueSolved}
                    />
                    <StatCard
                        title="Hackathons Participated"
                        value={`${hackathonsParticipated} `}
                        link={{ text: "Enter Hackathon", href: "/hackathon" }}
                        className={getCardStyle(nextHackathon)}
                    />
                </div>

                {/* Column 2 */}
                <div className="flex flex-col gap-6">
                    <StatCard
                        title="Contests Entered"
                        value={`${contestsEntered} `}
                        link={{ text: "Enter Contest", href: "/contest" }}
                        className={getCardStyle(nextContest)}
                    />
                    <ExternalStatsCard user={user || {}} />

                </div>

                {/* Column 3 */}
                <div className="flex flex-col gap-6">
                    <ActivityGraph data={activityData}>
                        <RecentActivityList activities={allActivity as any} />
                    </ActivityGraph>

                </div>
            </div>
        </div>
    );
}
