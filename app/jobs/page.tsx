
import React from "react";
import { getAllJobs } from "@/lib/jobs";
import { Briefcase, ArrowLeft } from "lucide-react";
import Link from "next/link";
import JobCard from "@/components/dashboard/JobCard";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
    const jobs = await getAllJobs();

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
                            <Briefcase className="h-6 w-6 text-blue-400" />
                            <span className="text-xl font-bold">Job Postings</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Available Jobs</h1>
                    <p className="text-gray-400">Opportunities posted by your teachers and placement coordinators.</p>
                </div>

                {jobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-700 bg-[#161616]/50 py-20 text-center">
                        <div className="rounded-full bg-gray-800 p-5 mb-4">
                            <Briefcase size={40} className="text-gray-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-300">No jobs posted yet</h3>
                        <p className="mt-2 text-sm text-gray-500 max-w-md">
                            Your teachers haven&apos;t posted any job opportunities yet. Check back soon!
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {jobs.map((job: any) => (
                            <JobCard key={job.id} job={job} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
