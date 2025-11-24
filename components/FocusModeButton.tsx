"use client";

import React, { useState } from "react";
import { Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FocusModeButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleFocusMode = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/focus/next");
            const data = await res.json();

            if (data.assignmentId) {
                router.push(`/assignment/${data.assignmentId}?mode=focus`);
            } else if (data.message === "No more questions") {
                alert("You have solved all available questions! Great job!");
            } else {
                alert("Failed to start Focus Mode. Please try again.");
            }
        } catch (error) {
            console.error("Error starting focus mode:", error);
            alert("An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleFocusMode}
            disabled={loading}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-2 text-sm font-medium text-white hover:from-amber-600 hover:to-orange-700 disabled:opacity-50"
        >
            <Zap className="h-4 w-4" />
            {loading ? "Loading..." : "Focus Mode"}
        </button>
    );
}
