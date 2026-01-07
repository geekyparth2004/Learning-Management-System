"use client";

import { useState, useEffect } from "react";
import { Trophy, RefreshCw, Loader2, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

type LeaderboardEntry = {
    id: string;
    name: string | null;
    image: string | null;
    username?: string | null;
    score: number;
    details?: any; // For external stats
};

export function LeaderboardModal() {
    const { data: session } = useSession();
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"internal" | "external">("internal");
    const [period, setPeriod] = useState<"weekly" | "monthly" | "lifetime">("lifetime");

    const [data, setData] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(false);

    const [refreshing, setRefreshing] = useState(false);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/leaderboard?type=${activeTab}&period=${period}`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error("Failed to fetch leaderboard", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchLeaderboard();
        }
    }, [open, activeTab, period]);

    const handleRefresh = async () => {
        if (!session) return;
        setRefreshing(true);
        try {
            const res = await fetch("/api/leaderboard/refresh", { method: "POST" });
            if (res.ok) {
                alert("Stats updated successfully"); // Simple alert since no toast lib
                fetchLeaderboard(); // Reload data
            } else {
                const json = await res.json();
                if (json.error === "Codolio username not linked") {
                    alert("Please link your Codolio username in Profile settings first.");
                } else {
                    alert(json.error || "Failed to update stats");
                }
            }
        } catch (error) {
            alert("Something went wrong");
        } finally {
            setRefreshing(false);
        }
    };

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-zinc-800 text-yellow-500 hover:text-yellow-600 transition-colors"
                title="Leaderboard"
            >
                <Trophy className="h-5 w-5" />
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            {/* Modal Content */}
            <div className="w-full max-w-3xl max-h-[85vh] flex flex-col bg-[#161616] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 pb-4 border-b border-zinc-800 shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Trophy className="h-6 w-6 text-yellow-500" />
                            Leaderboard
                        </h2>
                        <button
                            onClick={() => setOpen(false)}
                            className="text-zinc-400 hover:text-white transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* Custom Tabs */}
                        <div className="flex bg-zinc-900/50 p-1 rounded-lg w-full sm:w-auto">
                            <button
                                onClick={() => setActiveTab("internal")}
                                className={cn(
                                    "flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                                    activeTab === "internal"
                                        ? "bg-zinc-800 text-white shadow-sm"
                                        : "text-zinc-400 hover:text-white"
                                )}
                            >
                                Problems Solved
                            </button>
                            <button
                                onClick={() => setActiveTab("external")}
                                className={cn(
                                    "flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                                    activeTab === "external"
                                        ? "bg-zinc-800 text-white shadow-sm"
                                        : "text-zinc-400 hover:text-white"
                                )}
                            >
                                Contest Attended
                            </button>
                        </div>

                        {/* Period Filter */}
                        <div className="flex bg-zinc-900/50 rounded-lg p-1 w-full sm:w-auto justify-center">
                            {(["weekly", "monthly", "lifetime"] as const).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={cn(
                                        "px-3 py-1.5 text-sm font-medium rounded-md transition-all capitalize",
                                        period === p
                                            ? "bg-zinc-800 text-white shadow-sm"
                                            : "text-zinc-400 hover:text-white"
                                    )}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {data.length === 0 ? (
                                <div className="text-center text-zinc-500 py-10">
                                    No entries found for this period.
                                </div>
                            ) : (
                                data.map((entry, index) => (
                                    <div
                                        key={entry.id}
                                        className={cn(
                                            "flex items-center gap-4 p-3 rounded-xl transition-colors border border-transparent",
                                            entry.id === session?.user?.id
                                                ? "bg-indigo-500/10 border-indigo-500/20"
                                                : "hover:bg-zinc-800/50"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm",
                                            index === 0 ? "bg-yellow-500/20 text-yellow-500" :
                                                index === 1 ? "bg-zinc-300/20 text-zinc-300" :
                                                    index === 2 ? "bg-orange-500/20 text-orange-500" :
                                                        "text-zinc-500"
                                        )}>
                                            {index + 1}
                                        </div>

                                        <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700">
                                            {entry.image ? (
                                                <img src={entry.image} alt={entry.name || ""} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-zinc-400 font-bold">
                                                    {entry.name?.[0] || "?"}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-white flex items-center gap-2 truncate">
                                                {entry.name}
                                                {entry.id === session?.user?.id && (
                                                    <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">
                                                        You
                                                    </span>
                                                )}
                                            </div>
                                            {activeTab === "external" && entry.username && (
                                                <div className="text-xs text-zinc-500 truncate">
                                                    @{entry.username} (Codolio)
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-right shrink-0">
                                            <div className="font-bold text-lg text-white">
                                                {entry.score}
                                            </div>
                                            <div className="text-xs text-zinc-500 uppercase tracking-wider">
                                                {activeTab === "internal" ? "Solved" : "Contests"}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Footer (Sync Button) */}
                {activeTab === "external" && (
                    <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 flex items-center justify-between text-sm shrink-0">
                        <span className="text-zinc-500 hidden sm:inline">
                            Connect your Codolio account to appear here.
                        </span>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md transition-colors disabled:opacity-50 text-sm font-medium ml-auto sm:ml-0"
                        >
                            {refreshing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )}
                            Sync Stats
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
