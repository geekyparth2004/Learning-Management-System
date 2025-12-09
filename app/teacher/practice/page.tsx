import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { Plus, Trash2, Code, FileCode, Terminal } from "lucide-react";
import { redirect } from "next/navigation";
import FormattedDate from "@/components/FormattedDate";

export default async function TeacherPracticePage() {
    const session = await auth();
    if (session?.user?.role !== "TEACHER") {
        return <div>Unauthorized</div>;
    }

    const problems = await db.problem.findMany({
        where: { isPractice: true },
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: { submissions: true }
            }
        }
    });

    async function deleteProblem(formData: FormData) {
        "use server";
        const problemId = formData.get("problemId") as string;
        await db.problem.delete({ where: { id: problemId } });
        redirect("/teacher/practice");
    }

    return (
        <div className="min-h-screen bg-[#0e0e0e] text-white p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <Link href="/" className="text-sm text-gray-400 hover:text-white mb-2 block">← Back to Dashboard</Link>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                            Practice Arena
                        </h1>
                        <p className="text-gray-400">Manage DSA and Coding practice problems.</p>
                    </div>
                    <Link
                        href="/teacher/practice/create"
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-bold hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4" />
                        Add Question
                    </Link>
                </div>

                <div className="space-y-4">
                    {problems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-800 bg-[#161616] p-12 text-center text-gray-400">
                            <Code className="mb-4 h-12 w-12 opacity-50" />
                            <p className="text-lg">No practice problems added yet.</p>
                            <Link href="/teacher/practice/create" className="mt-4 text-blue-400 hover:underline">
                                Add your first question
                            </Link>
                        </div>
                    ) : (
                        problems.map((problem) => (
                            <div
                                key={problem.id}
                                className="flex items-center justify-between rounded-xl border border-gray-800 bg-[#161616] p-6 transition-all hover:border-gray-700"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-bold">{problem.title}</h3>
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${problem.difficulty === "Easy" ? "bg-green-900/30 text-green-400" :
                                                problem.difficulty === "Medium" ? "bg-yellow-900/30 text-yellow-400" :
                                                    "bg-red-900/30 text-red-400"
                                            }`}>
                                            {problem.difficulty}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-400 line-clamp-1">
                                        {problem.description || "No description"}
                                    </p>

                                    <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <Terminal className="h-4 w-4" />
                                            <span>{problem._count.submissions} Submissions</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span>Added: <FormattedDate date={problem.createdAt.toISOString()} /></span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <form action={deleteProblem}>
                                        <input type="hidden" name="problemId" value={problem.id} />
                                        <button
                                            type="submit"
                                            className="rounded p-2 text-red-500 hover:bg-red-900/20"
                                            title="Delete Problem"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
