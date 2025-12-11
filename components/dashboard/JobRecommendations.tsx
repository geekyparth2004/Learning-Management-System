
"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, RefreshCcw } from "lucide-react";
import JobCard from "./JobCard";

interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    salary?: string | null;
    link: string;
    platform: string;
    postedAt: string;
}

export default function JobRecommendations() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await fetch("/api/jobs");
                if (res.ok) {
                    const data = await res.json();
                    setJobs(data);
                }
            } catch (error) {
                console.error("Failed to load jobs", error);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

    if (loading) {
        return (
            <div className="rounded-xl border border-gray-800 bg-[#161616] p-6 animate-pulse">
                <div className="h-6 w-1/3 rounded bg-gray-800 mb-4"></div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="h-32 rounded bg-gray-800"></div>
                    <div className="h-32 rounded bg-gray-800"></div>
                    <div className="h-32 rounded bg-gray-800"></div>
                </div>
            </div>
        );
    }

    const [showAll, setShowAll] = useState(false);

    if (jobs.length === 0) return null;

    const displayedJobs = showAll ? jobs : jobs.slice(0, 5);

    return (
        <div className="flex flex-col rounded-xl border border-gray-800 bg-[#161616] p-6">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="text-yellow-400" size={20} />
                    <h3 className="text-lg font-bold text-white">Recommended Jobs for You</h3>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400">
                        Updated daily • {jobs.length} new jobs
                    </span>
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="text-xs font-bold text-blue-400 hover:text-blue-300"
                    >
                        {showAll ? "Show Less" : "View All"}
                    </button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {displayedJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                ))}
            </div>

            {!showAll && jobs.length > 5 && (
                <button
                    onClick={() => setShowAll(true)}
                    className="mt-4 w-full rounded-lg border border-gray-800 bg-gray-900/50 py-2 text-sm font-medium text-gray-400 hover:border-gray-700 hover:text-white"
                >
                    Show {jobs.length - 5} more jobs
                </button>
            )}
        </div>
    );
}
