
"use client";

import React, { useState, useEffect } from "react";
import { X, Trophy, Rocket } from "lucide-react";
import { useRouter } from "next/navigation";

interface NotificationItem {
    id: string;
    title: string;
    category: "CONTEST" | "HACKATHON";
    createdAt: string;
    startTime: string;
}

export default function NewContestBanner() {
    const [latest, setLatest] = useState<NotificationItem | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkNew = async () => {
            try {
                const res = await fetch("/api/notifications/contests");
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) {
                        const topItem: NotificationItem = data[0];

                        // Logic: Show if created recently (e.g. last 48 hours)
                        // AND not dismissed
                        const now = new Date();
                        const created = new Date(topItem.createdAt);
                        const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

                        if (diffHours < 48) {
                            const dismissedId = localStorage.getItem("dismissedBannerId");
                            if (dismissedId !== topItem.id) {
                                setLatest(topItem);
                                setIsVisible(true);
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("Banner check failed", e);
            }
        };

        // Delay slightly for effect
        const timer = setTimeout(checkNew, 1000);
        return () => clearTimeout(timer);
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        if (latest) {
            localStorage.setItem("dismissedBannerId", latest.id);
        }
    };

    const handleAction = () => {
        if (!latest) return;
        handleDismiss();
        if (latest.category === "HACKATHON") {
            router.push("/hackathon");
        } else {
            router.push(`/contest/${latest.id}`);
        }
    };

    if (!isVisible || !latest) return null;

    return (
        <div className="fixed top-4 left-1/2 z-50 w-full max-w-md -translate-x-1/2 animate-in slide-in-from-top-4 fade-in duration-500">
            <div className="relative mx-4 flex items-start gap-4 rounded-xl border border-blue-500/30 bg-[#0e0e0e]/90 p-4 shadow-2xl backdrop-blur-md ring-1 ring-blue-500/20">
                <button
                    onClick={handleDismiss}
                    className="absolute right-2 top-2 rounded-full p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
                >
                    <X size={16} />
                </button>

                <div className="rounded-full bg-blue-500/20 p-3 text-blue-400">
                    {latest.category === "HACKATHON" ? <Rocket size={24} /> : <Trophy size={24} />}
                </div>

                <div className="flex-1 pt-1">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-white">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        New {latest.category === "CONTEST" ? "Contest" : "Hackathon"} Added!
                    </h4>
                    <p className="mt-1 text-sm text-gray-300">
                        "{latest.title}" is now open for registration.
                    </p>
                    <button
                        onClick={handleAction}
                        className="mt-3 text-sm font-bold text-blue-400 hover:text-blue-300 hover:underline"
                    >
                        Check it out →
                    </button>
                </div>
            </div>
        </div>
    );
}
