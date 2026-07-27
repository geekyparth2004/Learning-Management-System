import React from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { ArrowLeft, Clock, Calendar, Globe } from "lucide-react";
import ContestEditor from "@/components/ContestEditor";

export default async function TeacherAssessmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (session?.user?.role !== "TEACHER") {
        return <div>Unauthorized</div>;
    }

    const { id } = await params;
    const assessment = await db.contest.findUnique({
        where: { id },
        include: {
            problems: true
        }
    });

    if (!assessment) {
        notFound();
    }

    if (assessment.type === "EXTERNAL") {
        // For external assessments, maybe just show details or allow delete?
        // Since we don't have a specific edit page for external metadata yet, just show info.
        return (
            <div className="min-h-screen bg-[#0e0e0e] text-white p-8">
                <div className="max-w-4xl mx-auto">
                    <Link href="/teacher/assessment" className="mb-6 flex items-center gap-2 text-sm text-gray-400 hover:text-white">
                        <ArrowLeft className="h-4 w-4" /> Back to Assessments
                    </Link>
                    <div className="rounded-xl border border-gray-800 bg-[#161616] p-8">
                        <h1 className="text-3xl font-bold mb-4">{assessment.title} <span className="text-sm font-normal text-orange-400 border border-orange-900 bg-orange-900/20 px-2 py-1 rounded ml-2">EXTERNAL</span></h1>
                        <p className="text-gray-400 mb-6">{assessment.description}</p>

                        <div className="space-y-4 text-sm text-gray-300">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>Starts: {new Date(assessment.startTime).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>Ends: {new Date(assessment.endTime).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                <span>Platform: {assessment.platformName}</span>
                            </div>
                            <div className="mt-4 p-4 bg-[#111111] rounded border border-gray-800">
                                Link: <a href={assessment.contestLink || "#"} target="_blank" className="text-blue-400 hover:underline">{assessment.contestLink}</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0e0e0e] text-white p-8">
            <div className="max-w-6xl mx-auto">
                <Link href="/teacher/assessment" className="mb-6 flex items-center gap-2 text-sm text-gray-400 hover:text-white">
                    <ArrowLeft className="h-4 w-4" /> Back to Assessments
                </Link>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">{assessment.title}</h1>
                    <p className="text-gray-400 mb-4">{assessment.description}</p>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Starts: {new Date(assessment.startTime).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Ends: {new Date(assessment.endTime).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Editor for Internal Problems */}
                <ContestEditor
                    contest={{
                        ...assessment,
                        startTime: assessment.startTime.toISOString(),
                        endTime: assessment.endTime.toISOString(),
                        createdAt: assessment.createdAt.toISOString(),
                        updatedAt: assessment.updatedAt.toISOString(),
                        problems: [] // Avoid spreading Date objects from problems
                    }}
                    problems={assessment.problems.map(p => ({
                        ...p,
                        createdAt: p.createdAt.toISOString(),
                        updatedAt: p.updatedAt.toISOString(),
                    }))}
                />
            </div>
        </div>
    );
}
