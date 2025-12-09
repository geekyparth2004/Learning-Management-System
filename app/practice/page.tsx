import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { Code, Terminal, CheckCircle2, ArrowRight } from "lucide-react";

export default async function PracticePage() {
    const session = await auth();
    const problems = await db.problem.findMany({
        where: { isPractice: true },
        orderBy: { createdAt: "desc" },
        include: {
            submissions: {
                where: { userId: session?.user?.id },
                select: { status: true }
            }
        }
    });

    return (
        <div className="min-h-screen bg-[#0e0e0e] text-white p-8">
            <div className="max-w-5xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Link href="/" className="text-sm text-gray-400 hover:text-white mb-2 block">← Back to Dashboard</Link>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                            Practice Arena
                        </h1>
                        <p className="text-gray-400 mt-2">Master Data Structures and Algorithms with curated problems.</p>
                    </div>
                </div>

                {/* Problem List */}
                <section>
                    <div className="grid gap-4">
                        {problems.length === 0 ? (
                            <p className="text-gray-500 italic">No practice problems available at the moment.</p>
                        ) : (
                            problems.map(problem => {
                                const isSolved = problem.submissions.some(s => s.status === "PASSED");

                                return (
                                    <Link
                                        key={problem.id}
                                        href={`/practice/${problem.id}`}
                                        className="group block rounded-xl border border-gray-800 bg-[#161616] p-6 transition-all hover:border-blue-500 hover:bg-[#1a1a1a]"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`rounded-full p-2 ${isSolved ? 'bg-green-900/20 text-green-500' : 'bg-gray-800 text-gray-400'}`}>
                                                    {isSolved ? <CheckCircle2 className="h-6 w-6" /> : <Code className="h-6 w-6" />}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold group-hover:text-blue-400 transition-colors">{problem.title}</h3>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${problem.difficulty === "Easy" ? "bg-green-900/30 text-green-400" :
                                                            problem.difficulty === "Medium" ? "bg-yellow-900/30 text-yellow-400" :
                                                                "bg-red-900/30 text-red-400"
                                                            }`}>
                                                            {problem.difficulty}
                                                        </span>
                                                        <span className="text-xs text-gray-500">• DSA</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 text-blue-500 opacity-0 transition-opacity group-hover:opacity-100">
                                                <span className="text-sm font-bold">Solve Challenge</span>
                                                <ArrowRight className="h-4 w-4" />
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
