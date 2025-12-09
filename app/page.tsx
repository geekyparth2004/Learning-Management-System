import React from "react";
import Link from "next/link";
import { BookOpen, GraduationCap, LogIn, LogOut, User, Trophy, Code } from "lucide-react";
import { auth, signOut } from "@/auth";
import GitHubConnect from "@/components/GitHubConnect";
import { db } from "@/lib/db";
import StatCard from "@/components/dashboard/StatCard";
import ActivityGraph from "@/components/dashboard/ActivityGraph";
import ProblemsGraph from "@/components/dashboard/ProblemsGraph";
import HoursStatCard from "@/components/dashboard/HoursStatCard";

export default async function Home() {
  const session = await auth();
  const isTeacher = session?.user?.role === "TEACHER";

  let dashboardData = null;

  if (session && !isTeacher) {
    const userId = session.user.id;
    const now = new Date();

    // 1. Hours Learned
    const completedItems = await db.moduleItemProgress.findMany({
      where: { userId, isCompleted: true },
      include: { moduleItem: { select: { duration: true } } }
    });
    const totalSeconds = completedItems.reduce((acc, curr) => acc + (curr.moduleItem.duration || 0), 0);
    const hoursLearned = Math.round(totalSeconds / 3600);

    // Today's Hours
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayItems = completedItems.filter(item => {
      if (!item.completedAt) return false;
      return new Date(item.completedAt) >= todayStart;
    });
    const todaySeconds = todayItems.reduce((acc, curr) => acc + (curr.moduleItem.duration || 0), 0);
    const hoursToday = (todaySeconds / 3600).toFixed(1);

    // 2. Contests & Hackathons
    const contestsEntered = await db.contestRegistration.count({ where: { userId } });
    const hackathonsParticipated = await db.contestRegistration.count({
      where: { userId, contest: { type: "HACKATHON" } }
    });

    // 3. Problems Solved
    const solvedProblems = await db.submission.findMany({
      where: { userId, status: "PASSED" },
      select: { createdAt: true, problemId: true }
    });
    const uniqueSolved = new Set(solvedProblems.map(s => s.problemId)).size;

    // 4. Graphs
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const activityData = [];
    const problemsData = [];

    // Sort logic: Get last 7 days including today
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextDay = new Date(d);
      nextDay.setDate(d.getDate() + 1);

      const label = days[d.getDay()];

      // Activity: Submissions + Completions
      const solvedToday = solvedProblems.filter(s => {
        const sDate = new Date(s.createdAt);
        return sDate >= d && sDate < nextDay;
      }).length;

      const itemsCompletedToday = completedItems.filter(item => {
        if (!item.completedAt) return false;
        const cDate = new Date(item.completedAt);
        return cDate >= d && cDate < nextDay;
      }).length;

      activityData.push({ day: label, value: solvedToday + itemsCompletedToday });
      problemsData.push({ day: label, value: solvedToday });
    }

    dashboardData = {
      hoursLearned,
      hoursToday,
      contestsEntered,
      hackathonsParticipated,
      problemsSolved: uniqueSolved,
      activityData,
      problemsData
    };
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#0e0e0e] p-8 text-white">
      <div className="w-full max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
            LMS Platform
          </div>

          <div className="flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-4">
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
              {/* Top Row */}
              <HoursStatCard
                totalHours={dashboardData?.hoursLearned || 0}
                todayHours={dashboardData?.hoursToday || 0}
              />
              <StatCard
                title="Contests Entered"
                value={`${dashboardData?.contestsEntered || 0}`}
              />
              {/* Activity Graph spans 1 col, but row span 2? Let's check layout. 
                        User image: Activity is top right.
                     */}
              <div className="row-span-2">
                <ActivityGraph data={dashboardData?.activityData || []} />
              </div>

              {/* Second Row */}
              <div className="row-span-2">
                <ProblemsGraph
                  data={dashboardData?.problemsData || []}
                  totalSolved={dashboardData?.problemsSolved || 0}
                />
              </div>

              <StatCard
                title="Hackathons Participated"
                value={`${dashboardData?.hackathonsParticipated || 0}`}
              />

              {/* Empty/Nav Card for balance or features */}
              <Link
                href="/courses"
                className="flex flex-col justify-center gap-2 rounded-xl border border-gray-800 bg-[#161616] p-6 text-center hover:border-blue-500 hover:bg-[#1a1a1a] transition-all"
              >
                <h3 className="text-xl font-bold text-blue-400">Explore Courses</h3>
                <p className="text-sm text-gray-500">Continue your learning journey →</p>
              </Link>
              <Link
                href="/practice"
                className="flex flex-col justify-center gap-2 rounded-xl border border-gray-800 bg-[#161616] p-6 text-center hover:border-green-500 hover:bg-[#1a1a1a] transition-all"
              >
                <h3 className="text-xl font-bold text-green-400">Practice Arena</h3>
                <p className="text-sm text-gray-500">Solve more problems →</p>
              </Link>
            </div>
          </div>
        )}
      </div>
    </main >
  );
}
