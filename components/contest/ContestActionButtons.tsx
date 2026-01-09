"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Lock, Play, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContestActionButtonsProps {
    contestId: string;
    type: "INTERNAL" | "EXTERNAL";
    isRegistered: boolean;
    contestLink?: string | null;
    startTime: string | Date;
    endTime: string | Date;
    isCompleted?: boolean;
}

export default function ContestActionButtons({
    contestId,
    type,
    isRegistered,
    contestLink,
    startTime,
    endTime,
    isCompleted = false
}: ContestActionButtonsProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Status Checks
    const isUpcoming = now < start;
    const isLive = now >= start && now <= end;
    const isEnded = now > end;

    const handleRegister = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/contest/${contestId}/join`, {
                method: "POST"
            });

            if (res.ok) {
                router.refresh();
            } else {
                alert("Failed to register");
            }
        } catch (error) {
            console.error("Error registering:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStart = async (redirectUrl: string, isExternal: boolean = false) => {
        setIsLoading(true);
        try {
            // Mark as started in DB
            await fetch(`/api/contest/${contestId}/start`, { method: "POST" });

            if (isExternal) {
                window.open(redirectUrl, "_blank");
            } else {
                router.push(redirectUrl);
            }
        } catch (error) {
            console.error("Error starting contest:", error);
            // Fallback navigation
            if (isExternal) {
                window.open(redirectUrl, "_blank");
            } else {
                router.push(redirectUrl);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleComplete = async () => {
        if (!confirm("Are you sure you want to mark this hackathon as completed? It will move to your Past Events.")) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/contest/${contestId}/complete`, {
                method: "POST"
            });

            if (res.ok) {
                router.refresh();
            } else {
                alert("Failed to mark as completed");
            }
        } catch (error) {
            console.error("Error completing contest:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // External Contest Logic
    if (type === "EXTERNAL") {
        if (isCompleted) {
            return (
                <button disabled className="flex items-center justify-center gap-2 rounded-lg bg-green-900/20 border border-green-900 px-4 py-2 text-sm font-medium text-green-400 cursor-not-allowed">
                    Completed
                </button>
            );
        }

        if (isLive && isRegistered) {
            return (
                <div className="flex flex-col gap-2 w-full">
                    <button
                        onClick={() => handleStart(contestLink || "#", true)}
                        disabled={isLoading}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 animate-pulse transition-colors"
                    >
                        {isLoading ? "Opening..." : (
                            <>
                                <Play size={14} /> Go to Contest Link
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleComplete}
                        disabled={isLoading}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-700 bg-transparent px-4 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 transition-colors"
                    >
                        Mark as Completed
                    </button>
                </div>
            );
        }

        return (
            <a
                href={contestLink || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
                Register on Platform <ExternalLink size={14} />
            </a>
        );
    }

    // Internal Contest Logic
    if (isEnded || isCompleted) {
        return (
            <button disabled className="flex items-center justify-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
                {isCompleted ? "Completed" : "Ended"}
            </button>
        );
    }

    if (isRegistered) {
        if (isUpcoming) {
            return (
                <button disabled className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-900/20 border border-green-900 px-4 py-2 text-sm font-medium text-green-400 cursor-not-allowed">
                    <UserPlus size={14} /> Registered
                </button>
            );
        }

        // Live
        return (
            <button
                onClick={() => handleStart(`/contest/${contestId}`)}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 animate-pulse"
            >
                {isLoading ? "Starting..." : (
                    <>
                        <Play size={14} /> Start Contest
                    </>
                )}
            </button>
        );
    }

    // Not Registered
    return (
        <button
            onClick={handleRegister}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
            {isLoading ? "Registering..." : (
                <>
                    <UserPlus size={14} /> Register
                </>
            )}
        </button>
    );
}
