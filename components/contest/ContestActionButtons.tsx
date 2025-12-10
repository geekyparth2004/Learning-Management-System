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
}

export default function ContestActionButtons({
    contestId,
    type,
    isRegistered,
    contestLink,
    startTime,
    endTime
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

    // External Contest Logic
    if (type === "EXTERNAL") {
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
    if (isEnded) {
        return (
            <button disabled className="flex items-center justify-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
                Ended
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
                onClick={() => router.push(`/contest/${contestId}`)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 animate-pulse"
            >
                <Play size={14} /> Start Contest
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
