import React from "react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, User, Clock, CheckCircle, XCircle } from "lucide-react";
import { redirect } from "next/navigation";

async function getSubmissions(assignmentId: string) {
    try {
        const assignment = await db.assignment.findUnique({
            where: { id: assignmentId },
            include: {
                problems: {
                    include: {
                        submissions: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                            orderBy: {
                                createdAt: "desc",
                            },
                        },
                    },
                },
            },
        });
        return assignment;
    } catch (error) {
        return null;
    }
}

export default async function SubmissionsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    const { id } = await params;

    // Only teachers can access this page
    if (!session || session.user?.role !== "TEACHER") {
        redirect("/");
    }

    const assignment = await getSubmissions(id);

    if (!assignment) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0e0e0e] text-white">
                <h1 className="text-xl font-bold">Assignment not found</h1>
            </div>
        );
    }

    const allSubmissions = assignment.problems.flatMap((p) =>
        p.submissions.map((s) => ({ ...s, problemTitle: p.title }))
    );

    return (
        <div className="min-h-screen bg-[#0e0e0e] text-white">
            <header className="border-b border-gray-800 bg-[#161616] px-6 py-4">
                <div className="mx-auto flex max-w-7xl items-center gap-4">
                    <Link href="/" className="text-gray-400 hover:text-white">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">{assignment.title}</h1>
                        <p className="text-sm text-gray-400">Student Submissions</p>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl p-6">
                {allSubmissions.length === 0 ? (
                    <div className="rounded-lg border border-gray-800 bg-[#111111] p-8 text-center text-gray-500">
                        No submissions yet.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {allSubmissions.map((submission) => (
                            <div
                                key={submission.id}
                                className="rounded-xl border border-gray-800 bg-[#161616] p-6"
                            >
                                <div className="mb-4 flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="rounded-full bg-purple-900/20 p-3 text-purple-400">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white">{submission.user.name}</h3>
                                            <p className="text-sm text-gray-400">{submission.user.email}</p>
                                            <p className="mt-1 text-xs text-gray-500">{submission.problemTitle}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <Clock className="h-4 w-4" />
                                            {new Date(submission.createdAt).toLocaleString()}
                                        </div>
                                        {submission.status === "PASSED" ? (
                                            <div className="flex items-center gap-2 rounded-full bg-green-900/20 px-3 py-1 text-sm font-medium text-green-400">
                                                <CheckCircle className="h-4 w-4" />
                                                Passed
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 rounded-full bg-red-900/20 px-3 py-1 text-sm font-medium text-red-400">
                                                <XCircle className="h-4 w-4" />
                                                Failed
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-400">Language:</span>
                                        <span className="rounded bg-blue-900/20 px-2 py-0.5 text-xs font-medium text-blue-400">
                                            {submission.language === "cpp" ? "C++" : "Python"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-400">Submitted Code:</span>
                                        <pre className="mt-2 overflow-x-auto rounded border border-gray-700 bg-[#0e0e0e] p-4 text-sm text-gray-300">
                                            {submission.code}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
