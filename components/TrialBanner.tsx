"use client";

import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { useSession } from "next-auth/react";

export default function TrialBanner() {
    const { data: session, status } = useSession();
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let timerId: NodeJS.Timeout;
        
        const fetchStatus = async () => {
            try {
                const res = await fetch(`/api/user/subscription?t=${Date.now()}`, { cache: "no-store" });
                if (res.ok) {
                    const user = await res.json();
                    if (user && user.subscriptionStatus === "TRIAL" && user.trialExpiresAt) {
                        const trialEnd = new Date(user.trialExpiresAt).getTime();
                        
                        const updateTimer = () => {
                            const now = new Date().getTime();
                            const diffTime = Math.max(0, trialEnd - now);
                            setTimeLeft(diffTime);
                            
                            // Once expired, reload page so SubscriptionGuard locks them out
                            if (diffTime === 0) {
                                window.location.reload();
                            }
                        };
                        
                        updateTimer();
                        timerId = setInterval(updateTimer, 1000);
                    }
                }
            } catch (error) {
                // Ignore errors
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
        
        return () => {
            if (timerId) clearInterval(timerId);
        };
    }, [status]);

    if (loading || timeLeft === null) return null;

    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    return (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white w-full py-2 px-4 shadow-lg flex items-center justify-center relative z-50">
            <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="w-4 h-4 animate-pulse" />
                <span>
                    You are currently on a <strong>Free Trial</strong>. You have <strong className="font-mono">{formattedTime}</strong> remaining to explore the platform.
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
