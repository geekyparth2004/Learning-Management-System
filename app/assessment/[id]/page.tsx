import React from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import AssessmentPlayer from "@/components/assessment/AssessmentPlayer";
import AssessmentResults from "@/components/assessment/AssessmentResults";
import { viewerOrgId, visibleContestWhere } from "@/lib/org-scope";

export default async function StudentAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const { id } = await params;
    // Org scoping is folded into the lookup, so an assessment belonging to another
    // organization is an ordinary 404 — this covers the pre-start, in-progress and
    // post-end (leaderboard + question analysis) branches below in one place.
    const orgId = await viewerOrgId(session.user.id);
    const assessment = await db.contest.findFirst({
        where: { id, category: "ASSESSMENT", ...visibleContestWhere(orgId) },
    });

    if (!assessment) {
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

    // Check registration
    const registration = await db.contestRegistration.findUnique({
        where: { userId_contestId: { userId: session.user.id, contestId: id } },
    });

    // ── Assessment has ended: show leaderboard + question analysis to everyone ──
    if (now > assessment.endTime) {
        const leaderboard = await db.contestRegistration.findMany({
            where: { contestId: id },
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: [{ score: "desc" }, { completedAt: "asc" }],
        });

        let myResults: any = null;
        try {
            myResults = registration?.results ? JSON.parse(registration.results) : null;
        } catch {
            myResults = null;
        }

        return (
            <div className="min-h-screen bg-[#0e0e0e] text-white">
                <AssessmentResults
                    title={assessment.title}
                    endTime={assessment.endTime.toISOString()}
                    currentUserId={session.user.id}
                    leaderboard={leaderboard.map((reg, idx) => ({
                        rank: idx + 1,
                        userId: reg.userId,
                        name: reg.user.name || reg.user.email?.split("@")[0] || "Student",
                        score: reg.score,
                        completed: !!reg.completedAt,
                    }))}
                    myScore={registration?.score ?? null}
                    myResults={myResults}
                />
            </div>
        );
    }

    // ── Already submitted, assessment still running: no retakes, results pending ──
    if (registration?.completedAt) {
        return (
            <div className="min-h-screen bg-[#0e0e0e] text-white flex items-center justify-center">
                <div className="text-center space-y-4 p-8 max-w-lg">
                    <div className="text-6xl mb-4">✅</div>
                    <h1 className="text-2xl font-bold">Assessment Already Submitted</h1>
                    <p className="text-gray-400">
                        You have submitted this assessment. Your score, the leaderboard, and the full question
                        analysis will be available after it ends for everyone on {assessment.endTime.toLocaleString()}.
                    </p>
                    <Link href="/assessment" className="inline-block rounded-xl bg-gray-800 px-8 py-3 font-bold text-white hover:bg-gray-700 border border-gray-700">
                        Back to Assessments
                    </Link>
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

    return (
        <div className="min-h-screen bg-[#0e0e0e] text-white">
            <AssessmentPlayer
                assessmentId={id}
                title={assessment.title}
                config={config}
                duration={assessment.duration || 0}
                isRegistered={!!registration}
                userId={session.user.id}
                endTime={assessment.endTime.toISOString()}
            />
        </div>
    );
}
