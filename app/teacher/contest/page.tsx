import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { Plus, Trash2, ExternalLink, Calendar, Users, Trophy } from "lucide-react";
import { redirect } from "next/navigation";
import FormattedDate from "@/components/FormattedDate";

export default async function TeacherContestPage() {
    const session = await auth();
    if (session?.user?.role !== "TEACHER") {
        return <div>Unauthorized</div>;
    }

    const contests = await db.contest.findMany({
        where: { category: "CONTEST" },
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: { registrations: true }
            }
        }
    });

    async function deleteContest(formData: FormData) {
        "use server";
        const contestId = formData.get("contestId") as string;
        await db.contest.delete({ where: { id: contestId } });
        redirect("/teacher/contest");
    }

    return (
        <div className="min-h-screen bg-[#0e0e0e] text-white p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <Link href="/" className="text-sm text-gray-400 hover:text-white mb-2 block">← Back to Dashboard</Link>
                        <h1 className="text-3xl font-bold">Manage Contests</h1>
                    </div>
                    <Link
                        href="/teacher/contest/create"
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-bold hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4" />
                        Create Contest
                    </Link>
                </div>

                <div className="space-y-4">
                    {contests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-800 bg-[#161616] p-12 text-center text-gray-400">
                            <Trophy className="mb-4 h-12 w-12 opacity-50" />
                            <p className="text-lg">No contests created yet.</p>
                            <Link href="/teacher/contest/create" className="mt-4 text-blue-400 hover:underline">
                                Create your first contest
                            </Link>
                        </div>
                    ) : (
                        contests.map((contest) => (
                            <div
                                key={contest.id}
                                className="flex items-center justify-between rounded-xl border border-gray-800 bg-[#161616] p-6 transition-all hover:border-gray-700"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-bold">{contest.title}</h3>
                                        {contest.type === "EXTERNAL" && (
                                            <span className="rounded bg-orange-900/30 px-2 py-0.5 text-xs font-bold text-orange-400">
                                                EXTERNAL
                                            </span>
                                        )}
                                        {contest.type === "INTERNAL" && (
                                            <span className="rounded bg-blue-900/30 px-2 py-0.5 text-xs font-bold text-blue-400">
                                                INTERNAL
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm text-gray-400 line-clamp-1">
                                        {contest.description || "No description"}
                                    </p>

                                    <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">

                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            <span>
                                                <FormattedDate date={contest.startTime.toISOString()} />
                                            </span>
                                        </div>
                                        {contest.type === "INTERNAL" && (
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4" />
                                                <span>{contest._count.registrations} Participants</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {contest.type === "INTERNAL" && (
                                        <Link
                                            href={`/teacher/contest/${contest.id}`}
                                            className="rounded border border-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-800"
                                        >
                                            Edit
                                        </Link>
                                    )}
                                    <form action={deleteContest}>
                                        <input type="hidden" name="contestId" value={contest.id} />
                                        <button
                                            type="submit"
                                            className="rounded p-2 text-red-500 hover:bg-red-900/20"
                                            title="Delete Contest"
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
