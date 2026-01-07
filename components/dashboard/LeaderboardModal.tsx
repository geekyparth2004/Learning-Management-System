"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Trophy, RefreshCw, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
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
                toast.success("Stats updated successfully");
                fetchLeaderboard(); // Reload data
            } else {
                const json = await res.json();
                if (json.error === "Codolio username not linked") {
                    toast.error("Please link your Codolio username in Profile settings first.");
                } else {
                    toast.error("Failed to update stats");
                }
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-yellow-500 hover:text-yellow-600">
                    <Trophy className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
                <div className="p-6 pb-2 border-b">
                    <DialogHeader className="flex flex-row items-center justify-between">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <Trophy className="h-6 w-6 text-yellow-500" />
                            Leaderboard
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex items-center justify-between mt-4">
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-[400px]">
                            <TabsList>
                                <TabsTrigger value="internal">Problems Solved</TabsTrigger>
                                <TabsTrigger value="external">Contest Attended</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="flex bg-secondary rounded-lg p-1">
                            {(["weekly", "monthly", "lifetime"] as const).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={cn(
                                        "px-3 py-1.5 text-sm font-medium rounded-md transition-all capitalize",
                                        period === p
                                            ? "bg-background shadow-sm text-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {data.length === 0 ? (
                                <div className="text-center text-muted-foreground py-10">
                                    No entries found for this period.
                                </div>
                            ) : (
                                data.map((entry, index) => (
                                    <div
                                        key={entry.id}
                                        className={cn(
                                            "flex items-center gap-4 p-3 rounded-xl transition-colors border border-transparent",
                                            entry.id === session?.user?.id
                                                ? "bg-secondary/50 border-border"
                                                : "hover:bg-accent/50"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm",
                                            index === 0 ? "bg-yellow-100 text-yellow-700" :
                                                index === 1 ? "bg-slate-100 text-slate-700" :
                                                    index === 2 ? "bg-orange-100 text-orange-700" :
                                                        "text-muted-foreground"
                                        )}>
                                            {index + 1}
                                        </div>

                                        <Avatar className="h-10 w-10 border">
                                            <AvatarImage src={entry.image || ""} />
                                            <AvatarFallback>{entry.name?.[0] || "?"}</AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1">
                                            <div className="font-medium flex items-center gap-2">
                                                {entry.name}
                                                {entry.id === session?.user?.id && (
                                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                        You
                                                    </span>
                                                )}
                                            </div>
                                            {activeTab === "external" && entry.username && (
                                                <div className="text-xs text-muted-foreground">
                                                    @{entry.username} (Codolio)
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-right">
                                            <div className="font-bold text-lg">
                                                {entry.score}
                                            </div>
                                            <div className="text-xs text-muted-foreground uppercase tracking-wider">
                                                {activeTab === "internal" ? "Solved" : "Contests"}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {activeTab === "external" && (
                    <div className="p-4 border-t bg-muted/30 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                            Connect your Codolio account in settings to appear here.
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="gap-2"
                        >
                            {refreshing ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <RefreshCw className="h-3.5 w-3.5" />
                            )}
                            Sync Stats
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
