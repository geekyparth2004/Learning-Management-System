"use client";

import React, { useState } from "react";
import { ArrowRight, CheckCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ContestActionButtonsProps {
    contestId: string;
    isExternal: boolean;
    externalLink?: string | null;
    status: "LIVE" | "UPCOMING" | "PAST";
    registration?: {
        startedAt: Date | null;
        completedAt: Date | null;
    } | null;
}

export default function ContestActionButtons({
    contestId,
    isExternal,
    externalLink,
    status,
    registration
}: ContestActionButtonsProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isCompleted, setIsCompleted] = useState(!!registration?.completedAt);
    const [hasStarted, setHasStarted] = useState(!!registration?.startedAt);

    const handleStart = async (e: React.MouseEvent) => {
        if (hasStarted || status !== "LIVE") return;

        // If external, allow default behavior (link open) but trigger background start
        // If internal, allow navigation but trigger background start

        try {
            await fetch(`/api/contest/${contestId}/start`, { method: "POST" });
            setHasStarted(true);
            router.refresh();
        } catch (error) {
            console.error(error);
        }
    };

    const handleComplete = async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            await fetch(`/api/contest/${contestId}/complete`, { method: "POST" });
            setIsCompleted(true);
            router.refresh();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    if (status === "UPCOMING") {
        return (
            <button disabled className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-800 py-2 text-sm font-bold text-gray-400 cursor-not-allowed">
                Coming Soon
            </button>
        );
    }

    if (status === "PAST" && !isCompleted) {
        return (
            <button disabled className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-800 py-2 text-sm font-bold text-gray-500 cursor-not-allowed">
                Ended
            </button>
        );
    }

    if (isCompleted) {
        return (
            <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-900/20 py-2 text-sm font-bold text-green-400 border border-green-900">
                <CheckCircle className="h-4 w-4" /> Completed
            </div>
        );
    }

    // LIVE STATUS
    if (isExternal) {
        return (
            <div className="space-y-2">
                <a
                    href={externalLink || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleStart}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700"
                >
                    {hasStarted ? "Continue Contest" : "Enter Contest"} <ExternalLink className="h-4 w-4" />
                </a>

                {hasStarted && (
                    <button
                        onClick={handleComplete}
                        disabled={isLoading}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-green-600/50 bg-green-900/10 py-2 text-sm font-bold text-green-400 transition-colors hover:bg-green-900/20"
                    >
                        {isLoading ? "Marking..." : "Mark Completed"}
                    </button>
                )}
            </div>
        );
    }

    // INTERNAL
    return (
        <Link
            href={`/contest/${contestId}`}
            onClick={handleStart}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-2 text-sm font-bold text-white transition-colors hover:bg-green-700"
        >
            {hasStarted ? "Continue" : "Enter Contest"} <ArrowRight className="h-4 w-4" />
        </Link>
    );
}
