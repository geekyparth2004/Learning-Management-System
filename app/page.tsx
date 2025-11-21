import React from "react";
import Link from "next/link";
import { Code2, GraduationCap, LogIn, LogOut, User } from "lucide-react";
import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";
import DeleteAssignmentButton from "@/components/DeleteAssignmentButton";

async function getAssignments() {
  try {
    const assignments = await db.assignment.findMany({
      include: { problems: true },
      orderBy: { createdAt: "desc" },
    });
    return assignments;
  } catch (error) {
    return [];
  }
}

export default async function Home() {
  const session = await auth();
  const assignments = await getAssignments();
  const isTeacher = session?.user?.role === "TEACHER";

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#0e0e0e] p-8 text-white">
      <div className="w-full max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
            Learning Platform
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
          <h1 className="mb-2 text-4xl font-bold">Coding Assignments & Auto-Grading</h1>
          <p className="text-gray-400">Master algorithms with real-time feedback.</p>
        </div>

        {isTeacher && (
          <div className="mb-8 flex justify-center">
            <Link
              href="/assignment/create"
              className="group flex items-center gap-3 rounded-full border border-gray-800 bg-[#161616] px-6 py-3 transition-all hover:border-blue-500 hover:bg-[#1a1a1a]"
            >
              <div className="rounded-full bg-blue-900/20 p-2 text-blue-400 transition-colors group-hover:bg-blue-500 group-hover:text-white">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="font-medium">Create New Assignment</span>
            </Link>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-200">Available Assignments</h2>

          {assignments.length === 0 ? (
            <div className="rounded-lg border border-gray-800 bg-[#111111] p-8 text-center text-gray-500">
              No assignments found. {isTeacher ? "Create one to get started!" : "Check back later."}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="group relative overflow-hidden rounded-xl border border-gray-800 bg-[#161616] p-6 transition-all hover:border-purple-500"
                >
                  <Link
                    href={`/assignment/${assignment.id}`}
                    className="block"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="rounded-full bg-purple-900/20 p-3 text-purple-400 transition-colors group-hover:bg-purple-500 group-hover:text-white">
                        <Code2 className="h-6 w-6" />
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(assignment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-white">
                      {assignment.title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {assignment.problems.length} Problem{assignment.problems.length !== 1 && "s"}
                    </p>
                  </Link>
                  {isTeacher && (
                    <div className="mt-4 flex items-center gap-2">
                      <Link
                        href={`/assignment/${assignment.id}/submissions`}
                        className="rounded border border-gray-700 bg-[#1e1e1e] px-3 py-2 text-center text-sm font-medium text-gray-300 transition-colors hover:border-blue-500 hover:bg-blue-900/20 hover:text-blue-400"
                      >
                        View Submissions
                      </Link>
                      <DeleteAssignmentButton assignmentId={assignment.id} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main >
  );
}
