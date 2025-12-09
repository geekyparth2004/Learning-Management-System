"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TestPlayer from "@/components/TestPlayer";

export default function PracticePlayerPage() {
    const params = useParams();
    const router = useRouter();
    const [problem, setProblem] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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

    const handleComplete = (passed: boolean, score: number) => {
        if (passed) {
            alert(`Great job! You passed with a score of ${score.toFixed(0)}%`);
            router.push("/practice");
        } else {
            alert(`You achieved a score of ${score.toFixed(0)}%. Keep trying!`);
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
