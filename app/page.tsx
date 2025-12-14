import React from "react";
import Link from "next/link";
import { BookOpen, GraduationCap, LogIn, LogOut, User, Trophy, Code, ExternalLink, Clock, Calendar, ArrowRight } from "lucide-react";
import { auth, signOut } from "@/auth";
import GitHubConnect from "@/components/GitHubConnect";
import { db } from "@/lib/db";
import StatCard from "@/components/dashboard/StatCard";
import ActivityGraph from "@/components/dashboard/ActivityGraph";
import ProblemsGraph from "@/components/dashboard/ProblemsGraph";
import HoursStatCard from "@/components/dashboard/HoursStatCard";
import RecentActivityList from "@/components/dashboard/RecentActivityList";
import ExternalStatsCard from "@/components/dashboard/ExternalStatsCard";
import NotificationBell from "@/components/NotificationBell";
import NewContestBanner from "@/components/NewContestBanner";
import JobRecommendations from "@/components/dashboard/JobRecommendations";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();
  const isTeacher = session?.user?.role === "TEACHER";

  let dashboardData = null;
  let userPlatforms = null;

  if (session && !isTeacher) {
    const userId = session.user.id;
    const now = new Date();

    // 1. Fetch Module Progress (Completed + In-Progress)
    const moduleProgressItems = await db.moduleItemProgress.findMany({
      where: { userId }, // Removed isCompleted: true to track partial progress
      include: { moduleItem: { select: { duration: true, title: true } } }
    });

    // 1.1 Fetch User Platforms
    userPlatforms = await db.user.findUnique({
      where: { id: userId },
      select: { leetcodeUsername: true, codeforcesUsername: true, gfgUsername: true }
    });

    const moduleSeconds = moduleProgressItems.reduce((acc, curr) => {
      // If completed, use tracked duration OR fallback to full length
      if (curr.isCompleted) {
        return acc + (curr.duration || curr.moduleItem.duration || 0);
      }
      // If in-progress, ONLY use tracked duration
      return acc + (curr.duration || 0);
    }, 0);

    // 2. Fetch Contests & Hackathons Stats (Only Started)
    const contestsEntered = await db.contestRegistration.count({
      where: {
        userId,
        startedAt: { not: null } // Only count if actually started
      }
    });
    const hackathonsParticipated = await db.contestRegistration.count({
      where: {
        userId,
        contest: { type: "HACKATHON" },
        startedAt: { not: null } // Only count if actually started
      }
    });

    // 3. Fetch Solved Problems (and duration)
    const solvedProblems = await db.submission.findMany({
      where: { userId, status: "PASSED" },
      select: { createdAt: true, problemId: true, duration: true }
    });
    const uniqueSolved = new Set(solvedProblems.map(s => s.problemId)).size;
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

    const hoursLearned = Math.round(grandTotalSeconds / 3600);

    // 5. Calculate "Today's" Stats (Strict IST Midnight)
    const options: Intl.DateTimeFormatOptions = { timeZone: "Asia/Kolkata", year: 'numeric', month: '2-digit', day: '2-digit' };
    const istDateFormatter = new Intl.DateTimeFormat('en-US', options);
    const parts = istDateFormatter.formatToParts(now);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;

    // Explicitly construct midnight IST
    const todayStart = new Date(`${year}-${month}-${day}T00:00:00+05:30`);

    // Modules Today
    // Modules Today (Activity updates completedAt even for in-progress)
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
      d.setHours(0, 0, 0, 0); // Start of that day in IST-like local time

      const nextDay = new Date(d);
      nextDay.setDate(d.getDate() + 1);

      const label = days[d.getDay()];

      // Since 'd' is constructed from IST string, its .getTime() is effectively "Local IST Time treated as UTC" 
      // OR we need to be careful comparing with DB dates (which are true UTC).

      // DB dates are UTC. 
      // If d is "2023-10-27 00:00:00" (derived from IST), we want to find records where:
      // record.createdAt (UTC) falls within this IST day.
      // IST day starts at 00:00 IST -> which is Previous Day 18:30 UTC.

      // So we need to convert 'd' back to the true UTC timestamp for comparison.
      // 'd' here (via new Date(string)) creates a date object.
      // Easiest is to construct the specific range:
      // Start: d (IST 00:00) -> UTC timestamp
      // We can use the timezone offset logic again for precision.

      const currentDayIST = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
      currentDayIST.setDate(currentDayIST.getDate() - i);
      currentDayIST.setUTCHours(0, 0, 0, 0); // Midnight of that IST day

      const startRange = new Date(currentDayIST.getTime() - (5.5 * 60 * 60 * 1000)); // Back to real UTC
      const endRange = new Date(startRange.getTime() + (24 * 60 * 60 * 1000));

      const labelDate = new Date(startRange.getTime() + (5.5 * 60 * 60 * 1000)); // For Getting Day Name correctly
      const dayLabel = days[labelDate.getUTCDay()];

      // Activity: Submissions + Completions
      const solvedToday = solvedProblems.filter(s => {
        const sDate = new Date(s.createdAt);
        return sDate >= startRange && sDate < endRange;
      }).length;

      const itemsCompletedToday = moduleProgressItems.filter(item => {
        if (!item.completedAt || !item.isCompleted) return false; // Only count fully completed items for Activity Graph
        const cDate = new Date(item.completedAt);
        return cDate >= startRange && cDate < endRange;
      }).length;

      activityData.push({ day: dayLabel, value: solvedToday + itemsCompletedToday });
      problemsData.push({ day: dayLabel, value: solvedToday });
    }

    // 7. Recent Activity (Top 5 for Today)
    // Module Completions
    const recentModules = moduleProgressItems
      .filter(i => i.isCompleted && i.completedAt && new Date(i.completedAt) >= todayStart)
      .map(i => ({
        id: i.id,
        type: "MODULE_ITEM" as const,
        title: i.moduleItem.title,
        date: new Date(i.completedAt!)
      }));

    // Submissions
    // Need titles? The current solvedProblems select doesn't have titles.
    // Making a separate query for recent submissions to get titles.
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
      type: "SUBMISSION" as const,
      title: `Solved: ${s.problem.title} `,
      date: s.createdAt
    }));

    // Contest Details for Recent
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
      type: "CONTEST" as const,
      title: `Joined: ${c.contest.title} `,
      date: c.joinedAt
    }));

    // Combine and Sort
    const allActivity = [...recentModules, ...recentSolvedMapped, ...recentContestsMapped]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);

    dashboardData = {
      hoursLearned,
      hoursToday,
      contestsEntered,
      hackathonsParticipated,
      problemsSolved: uniqueSolved,
      activityData,
      problemsData,
      recentActivity: allActivity,
      contestStyle: getCardStyle(nextContest),
      hackathonStyle: getCardStyle(nextHackathon)
    };
  }

  // Define Activity Item Interface for Props
  interface ActivityItem {
    id: string;
    type: "MODULE_ITEM" | "SUBMISSION" | "CONTEST";
    title: string;
    date: Date;
    description?: string;
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-4 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white">Welcome to Learning Platform</h1>
          <p className="text-gray-400">Please sign in to access your dashboard.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            <LogIn className="h-5 w-5" />
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (isTeacher) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] p-8 text-white">
        <NewContestBanner />
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
              LMS Platform
            </div>

            <div className="flex items-center gap-4">
              {session ? (
                <div className="flex items-center gap-4">
                  <NotificationBell />
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <User className="h-4 w-4" />
                    <span>{session.user?.name} ({session.user?.role})</span>
                  </div>
                  <GitHubConnect isConnected={!!session.user?.githubAccessToken} />
                  <form
                    action={async () => {
                      "use server";
                      await signOut();
                    }}
                  >
                    <button className="flex items-center gap-2 rounded-full border border-gray-800 bg-[#161616] px-4 py-2 text-sm hover:bg-red-900/20 hover:text-red-400">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </form>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2 text-sm font-medium hover:bg-blue-700"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
              )}
            </div>
          </div>
          <div className="mb-12 text-center">
            <h1 className="mb-2 text-3xl font-bold">Teacher Dashboard</h1>
            <p className="text-gray-400 mb-8">Manage courses, contests, and track student progress.</p>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/teacher/courses/create"
                className="group flex flex-col items-center gap-4 rounded-xl border border-gray-800 bg-[#161616] p-8 text-center transition-all hover:border-blue-500 hover:bg-[#1a1a1a]"
              >
                <div className="rounded-full bg-blue-900/20 p-4 text-blue-400 transition-colors group-hover:bg-blue-500 group-hover:text-white">
                  <GraduationCap className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Create New Course</h3>
                  <p className="text-sm text-gray-400">Build a new course with modules and lessons.</p>
                </div>
              </Link>

              <Link
                href="/teacher/courses"
                className="group flex flex-col items-center gap-4 rounded-xl border border-gray-800 bg-[#161616] p-8 text-center transition-all hover:border-purple-500 hover:bg-[#1a1a1a]"
              >
                <div className="rounded-full bg-purple-900/20 p-4 text-purple-400 transition-colors group-hover:bg-purple-500 group-hover:text-white">
                  <BookOpen className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">View All Courses</h3>
                  <p className="text-sm text-gray-400">Browse and manage existing courses.</p>
                </div>
              </Link>

              <Link
                href="/teacher/contest"
                className="group flex flex-col items-center gap-4 rounded-xl border border-gray-800 bg-[#161616] p-8 text-center transition-all hover:border-orange-500 hover:bg-[#1a1a1a]"
              >
                <div className="rounded-full bg-orange-900/20 p-4 text-orange-400 transition-colors group-hover:bg-orange-500 group-hover:text-white">
                  <Trophy className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Manage Contests</h3>
                  <p className="text-sm text-gray-400">Create and monitor coding contests.</p>
                </div>
              </Link>

              <Link
                href="/teacher/hackathon"
                className="group flex flex-col items-center gap-4 rounded-xl border border-gray-800 bg-[#161616] p-8 text-center transition-all hover:border-purple-500 hover:bg-[#1a1a1a]"
              >
                <div className="rounded-full bg-purple-900/20 p-4 text-purple-400 transition-colors group-hover:bg-purple-500 group-hover:text-white">
                  <Trophy className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Manage Hackathons</h3>
                  <p className="text-sm text-gray-400">Organize hackathons and events.</p>
                </div>
              </Link>

              <Link
                href="/teacher/practice"
                className="group flex flex-col items-center gap-4 rounded-xl border border-gray-800 bg-[#161616] p-8 text-center transition-all hover:border-green-500 hover:bg-[#1a1a1a]"
              >
                <div className="rounded-full bg-green-900/20 p-4 text-green-400 transition-colors group-hover:bg-green-500 group-hover:text-white">
                  <Code className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Practice Arena</h3>
                  <p className="text-sm text-gray-400">Manage DSA and Coding practice problems.</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e] p-8 text-white">
      <NewContestBanner />
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
              LMS Platform
            </div>
            {!isTeacher && session && (
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  href="/practice"
                  className="text-sm font-medium text-gray-400 hover:text-green-400 transition-colors"
                >
                  Practice Arena
                </Link>
                <Link
                  href="/courses"
                  className="text-sm font-medium text-gray-400 hover:text-blue-400 transition-colors"
                >
                  Explore Courses
                </Link>
                <Link
                  href="/contest"
                  className="text-sm font-medium text-gray-400 hover:text-orange-400 transition-colors"
                >
                  Contests
                </Link>
                <Link
                  href="/hackathon"
                  className="text-sm font-medium text-gray-400 hover:text-purple-400 transition-colors"
                >
                  Hackathons
                </Link>
                <Link
                  href="/jobs"
                  className="text-sm font-medium text-gray-400 hover:text-yellow-400 transition-colors"
                >
                  Jobs
                </Link>
              </nav>
            )}
          </div>

          <div className="flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-4">
                <NotificationBell />
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <User className="h-4 w-4" />
                  <span>{session.user?.name} ({session.user?.role})</span>
                </div>
                <GitHubConnect isConnected={!!session.user?.githubAccessToken} />
                <form
                  action={async () => {
                    "use server";
                    await signOut();
                  }}
                >
                  <button className="flex items-center gap-2 rounded-full border border-gray-800 bg-[#161616] px-4 py-2 text-sm hover:bg-red-900/20 hover:text-red-400">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2 text-sm font-medium hover:bg-blue-700"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            )}
          </div>
        </div>

        {!session ? (
          <div className="flex flex-col items-center text-center mt-20">
            <h1 className="mb-4 text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Master Your Coding Journey
            </h1>
            <p className="mb-8 max-w-2xl text-lg text-gray-400">
              Join thousands of developers mastering algorithms, web development, and system design.
              Track your progress, compete in contests, and build your career.
            </p>
            <Link
              href="/login"
              className="rounded-full bg-blue-600 px-8 py-3 text-lg font-bold hover:bg-blue-700 transition-all hover:scale-105"
            >
              Get Started
            </Link>
          </div>
        ) : isTeacher ? (
          <div className="mb-12 text-center">
            <h1 className="mb-2 text-3xl font-bold">Teacher Dashboard</h1>
            <p className="text-gray-400 mb-8">Manage courses, contests, and track student progress.</p>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/teacher/courses/create"
                className="group flex flex-col items-center gap-4 rounded-xl border border-gray-800 bg-[#161616] p-8 text-center transition-all hover:border-blue-500 hover:bg-[#1a1a1a]"
              >
                <div className="rounded-full bg-blue-900/20 p-4 text-blue-400 transition-colors group-hover:bg-blue-500 group-hover:text-white">
                  <GraduationCap className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Create New Course</h3>
                  <p className="text-sm text-gray-400">Build a new course with modules and lessons.</p>
                </div>
              </Link>

              <Link
                href="/teacher/courses"
                className="group flex flex-col items-center gap-4 rounded-xl border border-gray-800 bg-[#161616] p-8 text-center transition-all hover:border-purple-500 hover:bg-[#1a1a1a]"
              >
                <div className="rounded-full bg-purple-900/20 p-4 text-purple-400 transition-colors group-hover:bg-purple-500 group-hover:text-white">
                  <BookOpen className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">View All Courses</h3>
                  <p className="text-sm text-gray-400">Browse and manage existing courses.</p>
                </div>
              </Link>

              <Link
                href="/teacher/contest"
                className="group flex flex-col items-center gap-4 rounded-xl border border-gray-800 bg-[#161616] p-8 text-center transition-all hover:border-orange-500 hover:bg-[#1a1a1a]"
              >
                <div className="rounded-full bg-orange-900/20 p-4 text-orange-400 transition-colors group-hover:bg-orange-500 group-hover:text-white">
                  <Trophy className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Manage Contests</h3>
                  <p className="text-sm text-gray-400">Create and monitor coding contests.</p>
                </div>
              </Link>

              <Link
                href="/teacher/hackathon"
                className="group flex flex-col items-center gap-4 rounded-xl border border-gray-800 bg-[#161616] p-8 text-center transition-all hover:border-purple-500 hover:bg-[#1a1a1a]"
              >
                <div className="rounded-full bg-purple-900/20 p-4 text-purple-400 transition-colors group-hover:bg-purple-500 group-hover:text-white">
                  <Trophy className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Manage Hackathons</h3>
                  <p className="text-sm text-gray-400">Organize hackathons and events.</p>
                </div>
              </Link>

              <Link
                href="/teacher/practice"
                className="group flex flex-col items-center gap-4 rounded-xl border border-gray-800 bg-[#161616] p-8 text-center transition-all hover:border-green-500 hover:bg-[#1a1a1a]"
              >
                <div className="rounded-full bg-green-900/20 p-4 text-green-400 transition-colors group-hover:bg-green-500 group-hover:text-white">
                  <Code className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Practice Arena</h3>
                  <p className="text-sm text-gray-400">Manage DSA and Coding practice problems.</p>
                </div>
              </Link>
            </div>
          </div>
        ) : (
          // STUDENT DASHBOARD
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Column 1 */}
              <div className="flex flex-col gap-6">
                <HoursStatCard
                  totalHours={dashboardData?.hoursLearned || 0}
                  todayHours={dashboardData?.hoursToday || 0}
                />
                <ProblemsGraph
                  data={dashboardData?.problemsData || []}
                  totalSolved={dashboardData?.problemsSolved || 0}
                />
                <StatCard
                  title="Hackathons Participated"
                  value={`${dashboardData?.hackathonsParticipated || 0} `}
                  link={{ text: "Enter Hackathon", href: "/hackathon" }}
                  className={dashboardData?.hackathonStyle}
                />
              </div>

              {/* Column 2 */}
              <div className="flex flex-col gap-6">
                <StatCard
                  title="Contests Entered"
                  value={`${dashboardData?.contestsEntered || 0} `}
                  link={{ text: "Enter Contest", href: "/contest" }}
                  className={dashboardData?.contestStyle}
                />
                <ExternalStatsCard user={userPlatforms || {}} />

              </div>

              {/* Column 3 */}
              <div className="flex flex-col gap-6">
                <ActivityGraph data={dashboardData?.activityData || []}>
                  <RecentActivityList activities={dashboardData?.recentActivity || []} />
                </ActivityGraph>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
