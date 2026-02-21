"use client";

import React, { useEffect, useState } from "react";
import { Clock, Info } from "lucide-react";

export default function TrialBanner() {
    const [daysLeft, setDaysLeft] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch("/api/user/subscription");
                if (res.ok) {
                    const user = await res.json();
                    if (user && user.subscriptionStatus === "TRIAL" && user.trialExpiresAt) {
                        const trialEnd = new Date(user.trialExpiresAt);
                        const now = new Date();
                        const diffTime = Math.max(0, trialEnd.getTime() - now.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        setDaysLeft(diffDays);
                    }
                }
            } catch (error) {
                // Ignore errors
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
    }, []);

    if (loading || daysLeft === null) return null;

    return (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white w-full py-2 px-4 shadow-lg flex items-center justify-center relative z-50">
            <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="w-4 h-4 animate-pulse" />
                <span>
                    You are currently on a <strong>Free Trial</strong>. You have {daysLeft} {daysLeft === 1 ? 'day' : 'days'} remaining to explore the platform.
                </span>
            </div>
            <a
                href="/locked"
                className="ml-4 bg-white/20 hover:bg-white/30 transition-colors px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider"
            >
                Upgrade
            </a>
        </div>
    );
}
