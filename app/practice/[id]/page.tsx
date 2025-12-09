"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TestPlayer from "@/components/TestPlayer";

export default function PracticePlayerPage() {
    const params = useParams();
    const router = useRouter();
    const [problem, setProblem] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [startTime, setStartTime] = useState<number>(Date.now());

    useEffect(() => {
        // Reset start time when problem changes
        setStartTime(Date.now());
    }, [params.id]);

    useEffect(() => {
        const fetchProblem = async () => {
            try {
                const res = await fetch(`/api/practice/${params.id}`);
                if (!res.ok) {
                    if (res.status === 401) {
                        router.push("/login");
                        return;
                    }
                    throw new Error("Failed to fetch problem");
                }
                const data = await res.json();
                setProblem(data);
                setStartTime(Date.now());
            } catch (error) {
                console.error(error);
                alert("Error loading problem");
                router.push("/practice");
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchProblem();
        }
    }, [params.id, router]);

    const handleComplete = async (passed: boolean, score: number) => {
        try {
            const timeSpent = Math.floor((Date.now() - startTime) / 1000);

            // Always submit the result to track history and wallet
            const res = await fetch("/api/practice/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    problemId: params.id,
                    passed,
                    duration: timeSpent,
                    // ...
                })
            });

            const data = await res.json();

            if (passed) {
                if (data.rewarded) {
                    alert(`🎉 CONGRATULATIONS! 🎉\n\nYou passed and earned ₹5!\nWallet Balance: ₹${data.walletBalance}`);
                } else {
                    alert(`Great job! You passed!\n\n(No reward: Already solved this month)\nWallet Balance: ₹${data.walletBalance}`);
                }
                router.push("/practice");
            } else {
                alert(`You achieved a score of ${score.toFixed(0)}%. Keep trying to earn your reward!`);
            }
        } catch (error) {
            console.error(error);
            alert("Error submitting result");
        }
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center bg-[#0e0e0e] text-white">Loading problem...</div>;
    }

    if (!problem) {
        return <div className="flex h-screen items-center justify-center bg-[#0e0e0e] text-white">Problem not found</div>;
    }

    // Wrap the single problem in an array for TestPlayer
    const problems = [problem];

    return (
        <TestPlayer
            duration={60} // Default duration for practice, maybe 60 mins is fine or pass infinity if possible?
            // TestPlayer requires duration, so 60 is a reasonable default.
            // Ideally we'd modify TestPlayer to accept "unlimited", but for "exactly like assignment", 60 mins is safe.
            passingScore={60}
            problems={problems}
            onComplete={handleComplete}
        />
    );
}
