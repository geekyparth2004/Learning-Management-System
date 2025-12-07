import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { ExternalLink, Clock, Calendar, Trophy, ArrowRight } from "lucide-react";
import FormattedDate from "@/components/FormattedDate";

export default async function ContestPage() {
    const session = await auth();
    const contests = await db.contest.findMany({
        orderBy: { startTime: "asc" },
    });

    const now = new Date();
    const activeContests = contests.filter(c => c.startTime <= now && c.endTime > now);
    const upcomingContests = contests.filter(c => c.startTime > now);
    const pastContests = contests.filter(c => c.endTime <= now);

    return (
        <div className="min-h-screen bg-[#0e0e0e] text-white p-8">
            <div className="max-w-5xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Link href="/" className="text-sm text-gray-400 hover:text-white mb-2 block">← Back to Dashboard</Link>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">
                            Coding Contests
                        </h1>
                        <p className="text-gray-400 mt-2">Compete with others and test your skills in timed challenges.</p>
                    </div>
                </div>

                {/* Active Contests */}
                {activeContests.length > 0 && (
                    <section>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-400">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            Live Contests
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {activeContests.map(contest => (
                                <ContestCard key={contest.id} contest={contest} status="LIVE" />
                            ))}
                        </div>
                    </section>
                )}

                {/* Upcoming Contests */}
                <section>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-400">
                        <Calendar className="h-5 w-5" />
                        Upcoming Contests
                    </h2>
                    {upcomingContests.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {upcomingContests.map(contest => (
                                <ContestCard key={contest.id} contest={contest} status="UPCOMING" />
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No upcoming contests scheduled.</p>
                    )}
                </section>

                {/* Past Contests */}
                <section>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-400">
                        <Clock className="h-5 w-5" />
                        Past Contests
                    </h2>
                    {pastContests.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {pastContests.map(contest => (
                                <ContestCard key={contest.id} contest={contest} status="PAST" />
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No past contests found.</p>
                    )}
                </section>
            </div>
        </div>
    );
}

// ... inside ContestCard
function ContestCard({ contest, status }: { contest: any, status: "LIVE" | "UPCOMING" | "PAST" }) {
    const isExternal = contest.type === "EXTERNAL";

    return (
        <div className={`flex flex-col rounded-xl border p-6 transition-all ${status === "LIVE"
            ? "border-green-900 bg-green-900/10 hover:border-green-500"
            : "border-gray-800 bg-[#161616] hover:border-gray-600"
            }`}>
            <div className="mb-4">
                <div className="flex items-start justify-between">
                    <h3 className="font-bold text-lg line-clamp-1" title={contest.title}>{contest.title}</h3>
                    {isExternal && <ExternalLink className="h-4 w-4 text-gray-500" />}
                </div>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2 min-h-[2.5rem]">
                    {contest.description || "No description provided."}
                </p>
            </div>

            <div className="mt-auto space-y-4">
                <div className="space-y-1 text-xs text-gray-500">
                    <div className="flex justify-between">
                        <span>Starts:</span>
                        <span className="text-gray-300">
                            <FormattedDate date={contest.startTime.toISOString()} />
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Ends:</span>
                        <span className="text-gray-300">
                            <FormattedDate date={contest.endTime.toISOString()} />
                        </span>
                    </div>
                    {isExternal && contest.platformName && (
                        <div className="flex justify-between">
                            <span>Platform:</span>
                            <span className="text-blue-400">{contest.platformName}</span>
                        </div>
                    )}
                </div>

                {isExternal ? (
                    <a
                        href={contest.contestLink || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-bold transition-colors ${status === "LIVE"
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : status === "UPCOMING"
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : "bg-gray-800 text-gray-400 cursor-not-allowed"
                            }`}
                    >
                        {status === "PAST" ? "Ended" : "Go to Contest"} <ArrowRight className="h-4 w-4" />
                    </a>
                ) : (
                    <Link
                        href={`/contest/${contest.id}`}
                        className={`flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-bold transition-colors ${status === "LIVE"
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : status === "UPCOMING"
                                ? "bg-gray-700 text-gray-300 cursor-not-allowed" // Prevent entry before start
                                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white" // Allow viewing past leaderboards/problems?
                            }`}
                        aria-disabled={status === "UPCOMING"}
                    >
                        {status === "LIVE" ? "Enter Contest" : status === "UPCOMING" ? "Coming Soon" : "View Results"}
                    </Link>
                )}
            </div>
        </div>
    );
}
