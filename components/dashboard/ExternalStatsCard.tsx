
"use client";

import { useEffect, useState } from "react";
import { Edit2, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import PlatformConnection from "./PlatformConnection";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface ExternalStats {
    leetcode: {
        totalSolved: number;
        easySolved: number;
        mediumSolved: number;
        hardSolved: number;
        ranking: number;
        history?: { timestamp: number; rating: number }[];
    } | null;
    codeforces: {
        rating: number;
        maxRating: number;
        rank: string;
        maxRank: string;
    } | null;
    gfg: {
        totalSolved: number;
        codingScore: number;
    } | null;
}

interface ExternalStatsCardProps {
    user: {
        leetcodeUsername?: string | null;
        codeforcesUsername?: string | null;
        gfgUsername?: string | null;
    } | null;
}

export default function ExternalStatsCard({ user }: ExternalStatsCardProps) {
    const [stats, setStats] = useState<ExternalStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/external-stats");
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && (user.leetcodeUsername || user.codeforcesUsername || user.gfgUsername)) {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [user]);

    const hasProfiles = user && (user.leetcodeUsername || user.codeforcesUsername || user.gfgUsername);

    return (
        <>
            <div className="rounded-xl border border-[#2e2e2e] bg-[#0a0a0a] p-6">
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Coding Profiles</h3>
                    <button
                        onClick={() => setIsEditOpen(true)}
                        className="rounded p-2 text-gray-400 hover:bg-[#1e1e1e] hover:text-white"
                        title="Edit Profiles"
                    >
                        <Edit2 className="h-4 w-4" />
                    </button>
                </div>

                {!hasProfiles ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <p className="mb-4 text-sm text-gray-500">Connect your profiles to track your progress across platforms.</p>
                        <button
                            onClick={() => setIsEditOpen(true)}
                            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            Connect Profiles
                        </button>
                    </div>
                ) : loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* LeetCode */}
                        {user?.leetcodeUsername && (
                            <div className="rounded-lg border border-[#2e2e2e] bg-[#141414] p-4 transition hover:border-orange-500/30">
                                <div className="mb-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/1/19/LeetCode_logo_black.png" alt="LC" className="h-5 w-5 brightness-200 grayscale-0" />
                                        <span className="font-medium text-gray-200">LeetCode</span>
                                    </div>
                                    <a href={`https://leetcode.com/${user.leetcodeUsername}`} target="_blank" className="text-gray-500 hover:text-white">
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                </div>
                                {stats?.leetcode ? (
                                    <>
                                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                            <div className="rounded bg-[#1e1e1e] p-2">
                                                <div className="text-orange-400 font-bold">{stats.leetcode.totalSolved}</div>
                                                <div className="text-gray-500">Solved</div>
                                            </div>
                                            <div className="rounded bg-[#1e1e1e] p-2">
                                                <div className="text-white font-bold">{stats.leetcode.ranking.toLocaleString()}</div>
                                                <div className="text-gray-500">Rank</div>
                                            </div>
                                            <div className="rounded bg-[#1e1e1e] p-2">
                                                <div className="text-green-400 font-bold">{stats.leetcode.easySolved}</div>
                                                <div className="text-gray-500">Easy</div>
                                            </div>
                                            <div className="rounded bg-[#1e1e1e] p-2">
                                                <div className="text-yellow-400 font-bold">{stats.leetcode.mediumSolved}</div>
                                                <div className="text-gray-500">Medium</div>
                                            </div>
                                            <div className="rounded bg-[#1e1e1e] p-2">
                                                <div className="text-red-400 font-bold">{stats.leetcode.hardSolved}</div>
                                                <div className="text-gray-500">Hard</div>
                                            </div>
                                        </div>

                                        {stats.leetcode.history && stats.leetcode.history.length > 0 && (
                                            <div className="mt-4 h-32 w-full">
                                                <div className="mb-2 text-xs font-semibold text-gray-400">Contest Rating</div>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={stats.leetcode.history}>
                                                        <XAxis
                                                            dataKey="timestamp"
                                                            hide
                                                        />
                                                        <YAxis
                                                            hide
                                                            domain={['auto', 'auto']}
                                                        />
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: "#1e1e1e", border: "1px solid #333", borderRadius: "8px", fontSize: "12px" }}
                                                            labelFormatter={(ts) => new Date(ts * 1000).toLocaleDateString()}
                                                        />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="rating"
                                                            stroke="#fb923c"
                                                            strokeWidth={2}
                                                            dot={false}
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-xs text-red-400">Failed to load stats</div>
                                )}
                            </div>
                        )}

                        {/* Codeforces */}
                        {user?.codeforcesUsername && (
                            <div className="rounded-lg border border-[#2e2e2e] bg-[#141414] p-4 transition hover:border-blue-500/30">
                                <div className="mb-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <img src="https://cdn.iconscout.com/icon/free/png-256/free-code-forces-3628695-3029920.png" alt="CF" className="h-5 w-5 rounded object-contain bg-white p-[1px]" />
                                        <span className="font-medium text-gray-200">Codeforces</span>
                                    </div>
                                    <a href={`https://codeforces.com/profile/${user.codeforcesUsername}`} target="_blank" className="text-gray-500 hover:text-white">
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                </div>
                                {stats?.codeforces ? (
                                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                                        <div className="rounded bg-[#1e1e1e] p-2">
                                            <div className="text-blue-400 font-bold">{stats.codeforces.rating}</div>
                                            <div className="text-gray-500">Rating</div>
                                        </div>
                                        <div className="rounded bg-[#1e1e1e] p-2">
                                            <div className="text-white font-bold capitalize">{stats.codeforces.rank}</div>
                                            <div className="text-gray-500">Rank</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-xs text-red-400">Failed to load stats</div>
                                )}
                            </div>
                        )}

                        {/* GeeksforGeeks */}
                        {user?.gfgUsername && (
                            <div className="rounded-lg border border-[#2e2e2e] bg-[#141414] p-4 transition hover:border-green-500/30">
                                <div className="mb-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/4/43/GeeksforGeeks.svg" alt="GFG" className="h-5 w-5" />
                                        <span className="font-medium text-gray-200">GeeksforGeeks</span>
                                    </div>
                                    <a href={`https://auth.geeksforgeeks.org/user/${user.gfgUsername}`} target="_blank" className="text-gray-500 hover:text-white">
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                </div>
                                {stats?.gfg ? (
                                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                                        <div className="rounded bg-[#1e1e1e] p-2">
                                            <div className="text-green-400 font-bold">{stats.gfg.totalSolved}</div>
                                            <div className="text-gray-500">Problems</div>
                                        </div>
                                        <div className="rounded bg-[#1e1e1e] p-2">
                                            <div className="text-white font-bold">{stats.gfg.codingScore}</div>
                                            <div className="text-gray-500">Score</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-xs text-red-400">Failed to load stats</div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div >

            <PlatformConnection
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                initialData={{
                    leetcode: user?.leetcodeUsername,
                    codeforces: user?.codeforcesUsername,
                    gfg: user?.gfgUsername
                }}
                onUpdate={fetchData}
            />
        </>
    );
}
