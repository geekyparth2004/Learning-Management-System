import React from "react";
import { db } from "@/lib/db";
import { CACHE_KEYS, CACHE_TTL, cacheGetOrSet } from "@/lib/redis";
import StatCard from "@/components/dashboard/StatCard";
import ActivityGraph from "@/components/dashboard/ActivityGraph";
import ProblemsGraph from "@/components/dashboard/ProblemsGraph";
import HoursStatCard from "@/components/dashboard/HoursStatCard";
import RecentActivityList from "@/components/dashboard/RecentActivityList";
import ExternalStatsCard from "@/components/dashboard/ExternalStatsCard";

interface StudentDashboardProps {
    userId: string;
}

type ChartPoint = {
    day: string;
    value: number;
};

type ActivityItem = {
    id: string;
    type: "MODULE_ITEM" | "SUBMISSION" | "CONTEST";
    title: string;
    date: string;
};

type DashboardUser = {
    leetcodeUsername?: string | null;
    codeforcesUsername?: string | null;
    gfgUsername?: string | null;
    codolioBaseline?: number | null;
    codolioUsername?: string | null;
    externalRatings?: unknown;
} | null;

type StudentDashboardData = {
    user: DashboardUser;
    hoursLearned: string | number;
    hoursToday: string;
    problemsSolved: number;
    contestsEntered: number;
    hackathonsParticipated: number;
    activityGraph: ChartPoint[];
    problemsGraph: ChartPoint[];
    recentActivity: ActivityItem[];
    nextContestClassName: string;
    nextHackathonClassName: string;
};

export default async function StudentDashboard({ userId }: StudentDashboardProps) {
    const dashboardData = await getStudentDashboardData(userId);
    const recentActivity = dashboardData.recentActivity.map((activity) => ({
        ...activity,
        date: new Date(activity.date),
    }));

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex flex-col gap-6">
                    <HoursStatCard
                        totalHours={dashboardData.hoursLearned}
                        todayHours={dashboardData.hoursToday}
                    />
                    <ProblemsGraph
                        data={dashboardData.problemsGraph}
                        totalSolved={dashboardData.problemsSolved}
                    />
                    <StatCard
                        title="Hackathons Participated"
                        value={`${dashboardData.hackathonsParticipated} `}
                        link={{ text: "Enter Hackathon", href: "/hackathon" }}
                        className={dashboardData.nextHackathonClassName}
                    />
                </div>

                <div className="flex flex-col gap-6">
                    <StatCard
                        title="Contests Entered"
                        value={`${dashboardData.contestsEntered} `}
                        link={{ text: "Enter Contest", href: "/contest" }}
                        className={dashboardData.nextContestClassName}
                    />
                    <ExternalStatsCard user={dashboardData.user || {}} />
                </div>

                <div className="flex flex-col gap-6">
                    <ActivityGraph data={dashboardData.activityGraph}>
                        <RecentActivityList activities={recentActivity} />
                    </ActivityGraph>
                </div>
            </div>
        </div>
    );
}

async function getStudentDashboardData(userId: string) {
    return cacheGetOrSet(
        CACHE_KEYS.studentDashboard(userId),
        () => buildStudentDashboardData(userId),
        CACHE_TTL.SHORT
    );
}

async function buildStudentDashboardData(userId: string): Promise<StudentDashboardData> {
    const now = new Date();
    const todayStart = getIstDayStart(now);

    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
        moduleProgressItems,
        user,
        contestsEntered,
        hackathonsParticipated,
        uniqueSolvedGroup,
        lifetimePracticeStats,
        lastWeekSolved,
        completedContests,
        upcomingContests,
        upcomingHackathons,
        recentSolved,
        recentContests,
    ] = await Promise.all([
        db.moduleItemProgress.findMany({
            where: { userId },
            include: { moduleItem: { select: { duration: true, title: true } } },
        }),
        db.user.findUnique({
            where: { id: userId },
            select: {
                leetcodeUsername: true,
                codeforcesUsername: true,
                gfgUsername: true,
                codolioBaseline: true,
                codolioUsername: true,
                externalRatings: true,
            },
        }),
        db.contestRegistration.count({
            where: { userId, startedAt: { not: null }, contest: { category: "CONTEST" } },
        }),
        db.contestRegistration.count({
            where: { userId, startedAt: { not: null }, contest: { category: "HACKATHON" } },
        }),
        db.submission.groupBy({
            by: ["problemId"],
            where: {
                userId,
                status: "PASSED",
                problem: {
                    AND: [{ type: { not: "LEETCODE" } }, { leetcodeUrl: null }],
                },
            },
        }),
        db.submission.aggregate({
            _sum: { duration: true },
            where: {
                userId,
                status: "PASSED",
                problem: {
                    AND: [{ type: { not: "LEETCODE" } }, { leetcodeUrl: null }],
                },
            },
        }),
        db.submission.findMany({
            where: {
                userId,
                status: "PASSED",
                createdAt: { gte: sevenDaysAgo },
                problem: {
                    AND: [{ type: { not: "LEETCODE" } }, { leetcodeUrl: null }],
                },
            },
            select: { createdAt: true, duration: true },
        }),
        db.contestRegistration.findMany({
            where: { userId, startedAt: { not: null }, completedAt: { not: null } },
            select: { startedAt: true, completedAt: true },
        }),
        db.contest.findMany({
            where: { category: "CONTEST", endTime: { gt: now } },
            orderBy: { startTime: "asc" },
            take: 5,
        }),
        db.contest.findMany({
            where: { category: "HACKATHON", endTime: { gt: now } },
            orderBy: { startTime: "asc" },
            take: 5,
        }),
        db.submission.findMany({
            where: {
                userId,
                status: "PASSED",
                createdAt: { gte: todayStart },
            },
            orderBy: { createdAt: "desc" },
            take: 5,
            include: { problem: { select: { title: true } } },
        }),
        db.contestRegistration.findMany({
            where: {
                userId,
                joinedAt: { gte: todayStart },
            },
            orderBy: { joinedAt: "desc" },
            take: 5,
            include: { contest: { select: { title: true } } },
        }),
    ]);

    const contestIds = upcomingContests.map((contest) => contest.id);
    const hackathonIds = upcomingHackathons.map((contest) => contest.id);
    const allCandidateIds = [...contestIds, ...hackathonIds];

    const candidateRegistrations = allCandidateIds.length > 0
        ? await db.contestRegistration.findMany({
            where: {
                userId,
                contestId: { in: allCandidateIds },
            },
        })
        : [];

    const regMap = new Map(candidateRegistrations.map((registration) => [registration.contestId, registration]));
    const nextContest = upcomingContests.find((contest) => !regMap.get(contest.id)?.completedAt);
    const nextHackathon = upcomingHackathons.find((contest) => !regMap.get(contest.id)?.completedAt);

    const moduleSeconds = moduleProgressItems.reduce((total, progress) => {
        if (progress.isCompleted) {
            return total + Math.max(progress.duration || 0, progress.moduleItem.duration || 0);
        }
        return total + (progress.duration || 0);
    }, 0);

    let problemsSolved = uniqueSolvedGroup.length;
    if (user?.externalRatings && user.codolioBaseline !== null) {
        const stats = user.externalRatings as { totalQuestions?: number };
        problemsSolved += Math.max(0, (stats.totalQuestions || 0) - (user.codolioBaseline || 0));
    }

    const practiceSeconds = lifetimePracticeStats._sum.duration || 0;
    const contestSeconds = completedContests.reduce((total, contest) => {
        if (!contest.completedAt || !contest.startedAt) return total;
        return total + (contest.completedAt.getTime() - contest.startedAt.getTime()) / 1000;
    }, 0);

    const grandTotalSeconds = moduleSeconds + practiceSeconds + contestSeconds;
    const rawHours = grandTotalSeconds / 3600;
    const hoursLearned = rawHours < 100 ? rawHours.toFixed(1) : Math.round(rawHours);

    const todayModuleSeconds = moduleProgressItems.reduce((total, progress) => {
        if (!progress.completedAt || progress.completedAt < todayStart) return total;
        if (progress.isCompleted) {
            return total + Math.max(progress.duration || 0, progress.moduleItem.duration || 0);
        }
        return total + (progress.duration || 0);
    }, 0);

    const todayPracticeSeconds = lastWeekSolved
        .filter((submission) => submission.createdAt >= todayStart)
        .reduce((total, submission) => total + (submission.duration || 0), 0);

    const todayContestSeconds = completedContests.reduce((total, contest) => {
        if (!contest.completedAt || !contest.startedAt || contest.completedAt < todayStart) return total;
        return total + (contest.completedAt.getTime() - contest.startedAt.getTime()) / 1000;
    }, 0);

    const hoursToday = ((todayModuleSeconds + todayPracticeSeconds + todayContestSeconds) / 3600).toFixed(1);
    const { activityData, problemsData } = buildChartData(now, lastWeekSolved, moduleProgressItems);
    const recentModules = moduleProgressItems
        .filter((item) => item.isCompleted && item.completedAt && item.completedAt >= todayStart)
        .map((item) => ({
            id: item.id,
            type: "MODULE_ITEM" as const,
            title: item.moduleItem.title,
            date: item.completedAt!.toISOString(),
        }));

    const recentSolvedMapped = recentSolved.map((submission) => ({
        id: submission.id,
        type: "SUBMISSION" as const,
        title: `Solved: ${submission.problem.title} `,
        date: submission.createdAt.toISOString(),
    }));

    const recentContestsMapped = recentContests.map((contest) => ({
        id: contest.id,
        type: "CONTEST" as const,
        title: `Joined: ${contest.contest.title} `,
        date: contest.joinedAt.toISOString(),
    }));

    return {
        user,
        hoursLearned,
        hoursToday,
        problemsSolved,
        contestsEntered,
        hackathonsParticipated,
        activityGraph: activityData,
        problemsGraph: problemsData,
        recentActivity: [...recentModules, ...recentSolvedMapped, ...recentContestsMapped]
            .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
            .slice(0, 5),
        nextContestClassName: getCardStyle(now, nextContest, nextContest ? regMap.get(nextContest.id) : null),
        nextHackathonClassName: getCardStyle(now, nextHackathon, nextHackathon ? regMap.get(nextHackathon.id) : null),
    };
}

function getIstDayStart(date: Date) {
    const IST_OFFSET = 330 * 60 * 1000;
    const istDate = new Date(date.getTime() + IST_OFFSET);
    istDate.setUTCHours(0, 0, 0, 0);
    return new Date(istDate.getTime() - IST_OFFSET);
}

function buildChartData(
    now: Date,
    lastWeekSolved: { createdAt: Date }[],
    moduleProgressItems: { completedAt: Date | null; isCompleted: boolean }[]
) {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const activityData: ChartPoint[] = [];
    const problemsData: ChartPoint[] = [];

    for (let index = 6; index >= 0; index--) {
        const currentDayIST = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
        currentDayIST.setDate(currentDayIST.getDate() - index);
        currentDayIST.setUTCHours(0, 0, 0, 0);

        const startRange = new Date(currentDayIST.getTime() - 5.5 * 60 * 60 * 1000);
        const endRange = new Date(startRange.getTime() + 24 * 60 * 60 * 1000);
        const labelDate = new Date(startRange.getTime() + 5.5 * 60 * 60 * 1000);
        const dayLabel = days[labelDate.getUTCDay()];

        const solvedToday = lastWeekSolved.filter((submission) => {
            return submission.createdAt >= startRange && submission.createdAt < endRange;
        }).length;

        const itemsCompletedToday = moduleProgressItems.filter((item) => {
            return item.isCompleted && item.completedAt && item.completedAt >= startRange && item.completedAt < endRange;
        }).length;

        activityData.push({ day: dayLabel, value: solvedToday + itemsCompletedToday });
        problemsData.push({ day: dayLabel, value: solvedToday });
    }

    return { activityData, problemsData };
}

function getCardStyle(
    now: Date,
    contest: { startTime: Date; endTime: Date } | null | undefined,
    registration: { completedAt: Date | null } | null | undefined
) {
    if (!contest || registration?.completedAt) return "";

    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);
    const diff = start.getTime() - now.getTime();
    const oneHour = 60 * 60 * 1000;

    if (now >= start && now <= end) {
        return "border-red-500 bg-red-900/10 animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.3)]";
    }

    if (diff > 0 && diff <= 2 * oneHour) {
        return "border-yellow-500 bg-yellow-900/20";
    }

    if (diff > 2 * oneHour && diff <= 24 * oneHour) {
        return "border-blue-500 bg-blue-900/20";
    }

    return "";
}
