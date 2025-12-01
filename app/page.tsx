import React from "react";
import Link from "next/link";
import { BookOpen, GraduationCap, LogIn, LogOut, User } from "lucide-react";
import { auth, signOut } from "@/auth";

export default async function Home() {
  const session = await auth();
  const isTeacher = session?.user?.role === "TEACHER";

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#0e0e0e] p-8 text-white">
      <div className="w-full max-w-5xl">
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
          <h1 className="mb-2 text-4xl font-bold">Welcome to Your Learning Portal</h1>
          <p className="text-gray-400">Access your courses, track progress, and master new skills.</p>
        </div>

        <div className="flex flex-col items-center justify-center gap-6">
          {isTeacher ? (
            <div className="grid gap-6 md:grid-cols-2">
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
                href="/courses"
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
            </div>
          ) : (
             <Link
                href="/courses"
                className="group flex flex-col items-center gap-4 rounded-xl border border-gray-800 bg-[#161616] p-8 text-center transition-all hover:border-blue-500 hover:bg-[#1a1a1a]"
              >
                <div className="rounded-full bg-blue-900/20 p-4 text-blue-400 transition-colors group-hover:bg-blue-500 group-hover:text-white">
                  <BookOpen className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Browse Courses</h3>
                  <p className="text-sm text-gray-400">Explore available courses and start learning.</p>
                </div>
              </Link>
          )}
        </div>
      </div>
    </main >
  );
}
