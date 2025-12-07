"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Calendar, Trophy, ArrowRight, User } from "lucide-react";

interface ContestLobbyProps {
    contest: any;
    isRegistered: boolean;
    leaderboard?: any[];
    hasStarted?: boolean;
    duration?: number;
}

export default function ContestLobby({ contest, isRegistered, leaderboard }: ContestLobbyProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const now = new Date();
    const startTime = new Date(contest.startTime);
    const endTime = new Date(contest.endTime);

    const isUpcoming = now < startTime;
    const isActive = now >= startTime && now <= endTime;
    const isEnded = now > endTime;

    async function handleJoin() {
        setLoading(true);
        try {
            "use client";

            import React, { useState } from "react";
            import { useRouter } from "next/navigation";
            import { Clock, Calendar, Trophy, ArrowRight, User } from "lucide-react";

            interface ContestLobbyProps {
                contest: any;
                isRegistered: boolean;
                leaderboard?: any[];
                hasStarted?: boolean;
                duration?: number;
            }

            export default function ContestLobby({ contest, isRegistered, leaderboard, hasStarted, duration }: ContestLobbyProps) {
                const router = useRouter();
                const [loading, setLoading] = useState(false);

                const now = new Date();
                const startTime = new Date(contest.startTime);
                const endTime = new Date(contest.endTime);

                const isUpcoming = now < startTime;
                const isActive = now >= startTime && now <= endTime;
                const isEnded = now > endTime;

                async function handleJoin() {
                    setLoading(true);
                    try {
                        const res = await fetch(`/api/contest/${contest.id}/join`, {
                            method: "POST",
                        });
                        if (res.ok) {
                            router.refresh();
                        } else {
                            alert("Failed to join contest");
                        }
                    } catch (error) {
                        console.error(error);
                        alert("Error joining contest");
                    } finally {
                        setLoading(false);
                    }
                }

                async function handleStart() {
                    setLoading(true);
                    try {
                        const res = await fetch(`/api/contest/${contest.id}/start`, {
                            method: "POST",
                        });
                        if (res.ok) {
                            router.refresh(); // This should trigger page.tsx to render ContestPlayer
                        } else {
                            alert("Failed to start contest");
                        }
                    } catch (error) {
                        console.error(error);
                        alert("Error starting contest");
                    } finally {
                        setLoading(false);
                    }
                }

                return (
                    <div className="flex min-h-screen flex-col items-center bg-[#0e0e0e] text-white p-8">
                        <div className="w-full max-w-3xl rounded-2xl border border-gray-800 bg-[#161616] p-12 text-center shadow-2xl mt-12">
                            <div className="mb-6 flex justify-center">
                                <div className="rounded-full bg-orange-900/20 p-6 text-orange-400">
                                    <Trophy size={48} />
                                </div>
                            </div>

                            <h1 className="mb-4 text-4xl font-bold">{contest.title}</h1>
                            <p className="mb-8 text-lg text-gray-400">{contest.description}</p>

                            <div className="mb-10 grid grid-cols-2 gap-4 rounded-xl border border-gray-800 bg-[#111111] p-6">
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-sm font-medium text-gray-500">Starts</span>
                                    <span className="flex items-center gap-2 text-lg font-bold">
                                        <Calendar className="h-4 w-4 text-blue-400" />
                                        {startTime.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-sm font-medium text-gray-500">Duration</span>
                                    <span className="flex items-center gap-2 text-lg font-bold">
                                        <Clock className="h-4 w-4 text-green-400" />
                                        {Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))} mins
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-center flex-col items-center gap-4">
                                {isUpcoming ? (
                                    <button disabled className="cursor-not-allowed rounded-full bg-gray-800 px-8 py-4 text-lg font-bold text-gray-400">
                                        Contest Starts Soon
                                    </button>
                                ) : isEnded ? (
                                    <div className="w-full">
                                        <div className="mb-6 text-xl font-bold text-gray-300">Contest Ended</div>

                                        {leaderboard && leaderboard.length > 0 && (
                                            <div className="w-full overflow-hidden rounded-xl border border-gray-800 bg-[#111111] text-left">
                                                <table className="w-full">
                                                    <thead className="bg-[#1a1a1a] text-xs uppercase text-gray-400">
                                                        <tr>
                                                            <th className="px-6 py-4 font-semibold">Rank</th>
                                                            <th className="px-6 py-4 font-semibold">User</th>
                                                            <th className="px-6 py-4 font-semibold text-right">Score</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-800">
                                                        {leaderboard.map((entry, idx) => (
                                                            <tr key={entry.id} className="hover:bg-gray-800/50">
                                                                <td className="px-6 py-4">
                                                                    {idx === 0 ? <span className="text-yellow-400">🥇 1st</span> :
                                                                        idx === 1 ? <span className="text-gray-300">🥈 2nd</span> :
                                                                            idx === 2 ? <span className="text-orange-400">🥉 3rd</span> :
                                                                                <span className="text-gray-500">#{idx + 1}</span>}
                                                                </td>
                                                                <td className="px-6 py-4 flex items-center gap-3">
                                                                    <div className="h-8 w-8 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400">
                                                                        {entry.user.image ? <img src={entry.user.image} alt="" className="h-full w-full rounded-full" /> : <User size={14} />}
                                                                    </div>
                                                                    <span className="font-medium text-white">{entry.user.name || "Anonymous"}</span>
                                                                </td>
                                                                <td className="px-6 py-4 text-right font-bold text-green-400">
                                                                    {entry.score}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        {isRegistered ? (
                                            <>
                                                {/* If duration exists and NOT started: Show START button */}
                                                {duration && !hasStarted ? (
                                                    <div className="flex flex-col items-center gap-4">
                                                        <div className="rounded-lg bg-yellow-900/20 p-4 text-sm text-yellow-200 border border-yellow-900/50 max-w-md text-center">
                                                            <p className="font-bold mb-1">Attention:</p>
                                                            <p>This contest has a time limit of <span className="font-bold text-white">{duration} minutes</span>.</p>
                                                            <p>Your timer will start immediately when you click the button below.</p>
                                                        </div>
                                                        <button
                                                            onClick={handleStart}
                                                            disabled={loading}
                                                            className="rounded-full bg-orange-600 px-8 py-4 text-lg font-bold hover:bg-orange-700 disabled:opacity-50 animate-pulse"
                                                        >
                                                            {loading ? "Starting..." : "Start Contest Now"}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => router.refresh()}
                                                        className="rounded-full bg-green-600 px-8 py-4 text-lg font-bold hover:bg-green-700"
                                                    >
                                                        Enter Contest <ArrowRight className="inline ml-2" />
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <button
                                                onClick={handleJoin}
                                                disabled={loading}
                                                className="rounded-full bg-blue-600 px-8 py-4 text-lg font-bold hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {loading ? "Joining..." : "Join Contest"}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                );
            }
