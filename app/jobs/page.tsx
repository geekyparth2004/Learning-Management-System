
import React from "react";
import { getRecommendedJobs } from "@/lib/jobs";
import JobRecommendations from "@/components/dashboard/JobRecommendations";
import { Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import JobCard from "@/components/dashboard/JobCard";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
    const jobs = await getRecommendedJobs();

    return (
        <div className="min-h-screen bg-[#0e0e0e] text-white">
            {/* Header */}
            <header className="border-b border-gray-800 bg-[#161616]/50 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="rounded-full p-2 hover:bg-gray-800">
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-6 w-6 text-yellow-400" />
                            <span className="text-xl font-bold">Recommended Jobs</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">My Matching Jobs</h1>
                    <p className="text-gray-400">Curated opportunities updated daily based on top tech companies.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {jobs.map((job: any) => (
                        <JobCard key={job.id} job={job} />
                    ))}
                </div>
            </main>
        </div>
    );
}
