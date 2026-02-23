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
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#050505] font-sans selection:bg-purple-500/30">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[600px] rounded-full bg-purple-600/10 blur-[100px] pointer-events-none" />
          <div className="absolute top-1/4 left-0 h-[300px] w-[400px] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>
        </div>

        {/* Navigation Bar */}
        <nav className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/5 bg-black/20 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <Code className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-xl font-bold tracking-tight text-transparent">
              KodeCraft
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-white/5 px-6 py-2.5 text-sm font-medium text-white ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-white/20"
            >
              Sign In
              <LogIn className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </nav>

        {/* Main Hero Content */}
        <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pt-10 pb-20 text-center">

          <div className="inline-flex cursor-default items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.15)] mb-8 transition-colors hover:bg-indigo-500/20">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Elevate your coding journey
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-white sm:text-7xl">
            Master Programming. <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent drop-shadow-sm">
              Build the Future.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400 leading-relaxed sm:text-xl">
            Join thousands of developers leveling up their skills through interactive courses, real-world hackathons, and competitive coding arenas.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all hover:scale-105 hover:bg-indigo-500 hover:shadow-[0_0_40px_rgba(99,102,241,0.6)]"
            >
              Start Learning Now
              <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
                <div className="relative h-full w-8 bg-white/20" />
              </div>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-base font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Code className="h-5 w-5" />
              Explore Curriculum
            </Link>
          </div>

          {/* Feature Highlights */}
          <div className="mt-24 grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                title: "Interactive Courses",
                desc: "Learn through hands-on practice, not just passive videos.",
                icon: BookOpen,
                color: "text-blue-400",
                bg: "bg-blue-500/10",
                border: "border-blue-500/20"
              },
              {
                title: "Competitive Arena",
                desc: "Battle in realtime contests to climb the global leaderboard.",
                icon: Trophy,
                color: "text-orange-400",
                bg: "bg-orange-500/10",
                border: "border-orange-500/20"
              },
              {
                title: "Earn Certifications",
                desc: "Validate your skills and share achievements to LinkedIn.",
                icon: GraduationCap,
                color: "text-purple-400",
                bg: "bg-purple-500/10",
                border: "border-purple-500/20"
              }
            ].map((feat, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-left backdrop-blur-sm transition-all hover:border-white/10 hover:bg-white/[0.04] hover:-translate-y-1"
              >
                <div className={`mb-4 inline-flex items-center justify-center rounded-xl p-3 ${feat.bg} ${feat.border} border`}>
                  <feat.icon className={`h-6 w-6 ${feat.color}`} />
                </div>
                <h3 className="mb-2 text-lg font-bold text-white">{feat.title}</h3>
                <p className="text-sm text-gray-400">{feat.desc}</p>
              </div>
            ))}
          </div>
        </main>
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
