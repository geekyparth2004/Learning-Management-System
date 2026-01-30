"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";

interface StreakData {
    streak: number;
    lastActivityDate: string | null;
}

export default function StreakIndicator() {
    const [streakData, setStreakData] = useState<StreakData>({ streak: 0, lastActivityDate: null });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStreak() {
            try {
                const res = await fetch("/api/user/streak");
                if (res.ok) {
                    const data = await res.json();
                    setStreakData(data);
                }
            } catch (error) {
                console.error("Error fetching streak:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchStreak();
    }, []);

    const isActive = streakData.streak > 0;

    if (loading) {
        return (
            <div className="flex items-center gap-1.5 text-gray-500">
                <Flame className="h-5 w-5" />
                <span className="text-sm font-medium">-</span>
            </div>
        );
    }

    return (
        <div
            className={`flex items-center gap-1.5 transition-all ${isActive
                    ? "text-orange-500"
                    : "text-gray-500"
                }`}
            title={`${streakData.streak} day streak`}
        >
            <Flame
                className={`h-5 w-5 transition-all ${isActive
                        ? "fill-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                        : "fill-transparent"
                    }`}
            />
            <span className="text-sm font-medium">{streakData.streak}</span>
        </div>
    );
}
