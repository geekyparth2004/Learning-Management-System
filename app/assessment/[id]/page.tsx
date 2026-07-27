import React from "react";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import AssessmentPlayer from "@/components/assessment/AssessmentPlayer";

export default async function StudentAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const { id } = await params;
    const assessment = await db.contest.findUnique({
        where: { id },
    });

    if (!assessment || assessment.category !== "ASSESSMENT") {
        notFound();
    }

    const now = new Date();
    if (now < assessment.startTime) {
        return (
            <div className="min-h-screen bg-[#0e0e0e] text-white flex items-center justify-center">
                <div className="text-center space-y-4 p-8">
                    <div className="text-6xl mb-4">⏳</div>
                    <h1 className="text-2xl font-bold">Assessment Not Started Yet</h1>
                    <p className="text-gray-400">This assessment will begin at {assessment.startTime.toLocaleString()}</p>
                </div>
            </div>
        );
    }

    if (now > assessment.endTime) {
        return (
            <div className="min-h-screen bg-[#0e0e0e] text-white flex items-center justify-center">
                <div className="text-center space-y-4 p-8">
                    <div className="text-6xl mb-4">🔒</div>
                    <h1 className="text-2xl font-bold">Assessment Has Ended</h1>
                    <p className="text-gray-400">This assessment ended at {assessment.endTime.toLocaleString()}</p>
                </div>
            </div>
        );
    }

    // Parse config
    let config: any = { rounds: [] };
    try {
        config = JSON.parse(assessment.description || "{}");
    } catch {
        // fallback
    }

    // Check registration
    const registration = await db.contestRegistration.findUnique({
        where: { userId_contestId: { userId: session.user.id, contestId: id } },
    });

    return (
        <div className="min-h-screen bg-[#0e0e0e] text-white">
            <AssessmentPlayer
                assessmentId={id}
                title={assessment.title}
                config={config}
                duration={assessment.duration || 0}
                isRegistered={!!registration}
                userId={session.user.id}
            />
        </div>
    );
}
