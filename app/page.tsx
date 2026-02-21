import React, { Suspense } from "react";
import Link from "next/link";
import { BookOpen, GraduationCap, LogIn, LogOut, User, Trophy, Code } from "lucide-react";
import { auth, signOut } from "@/auth";
import GitHubConnect from "@/components/GitHubConnect";
import NotificationBell from "@/components/NotificationBell";
import StreakIndicator from "@/components/StreakIndicator";
import BadgeCheckOnLogin from "@/components/BadgeCheckOnLogin";
import NewContestBanner from "@/components/NewContestBanner";
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import { StatsSkeleton } from "@/components/dashboard/DashboardSkeletons";

// Force dynamic only if auth() requires it, but usually standard Next.js 15 handles this.
// Keeping it to ensure fresh data.
export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();
  const isTeacher = session?.user?.role === "TEACHER";

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-4 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white">Welcome to KodeCraft</h1>
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
              KodeCraft
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4">
                <NotificationBell />
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <User className="h-4 w-4" />
                  <span>{session.user?.name}</span>
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

  // STUDENT VIEW
  return (
    <div className="min-h-screen bg-[#0e0e0e] p-8 text-white">
      <NewContestBanner />
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
              KodeCraft
            </div>
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
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              <StreakIndicator />
              <NotificationBell />
              <Link href="/profile" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">
                <User className="h-4 w-4" />
                <span>{session.user?.name}</span>
              </Link>
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
          </div>
        </div>

        {/* Dashboard Content with Streaming */}
        <Suspense fallback={<StatsSkeleton />}>
          <StudentDashboard userId={session.user?.id || ""} />
        </Suspense>

        {/* Badge Check on Login - Awards pending badges and shows celebration */}
        <BadgeCheckOnLogin />
      </div>
    </div>
  );
}
