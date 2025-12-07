import React from "react";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import ContestLobby from "@/components/ContestLobby";
import ContestPlayer from "@/components/ContestPlayer";

export default async function ContestPlayPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) {
        redirect(`/login?callbackUrl=/contest`); // Redirect to login if not authenticated
    }

    const { id } = await params;
    const contest: any = await db.contest.findUnique({
        where: { id },
        include: {
            problems: {
                include: {
                    testCases: true
                }
            }
        }
    });

    if (!contest) {
        notFound();
    }

    // Handle External Contests
    if (contest.type === "EXTERNAL") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0e0e0e] text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">External Contest</h1>
                    <p className="mb-6">This contest is hosted on {contest.platformName}.</p>
                    <a href={contest.contestLink || "#"} className="bg-blue-600 px-6 py-2 rounded font-bold text-white hover:bg-blue-700">
                        Go to Contest
                    </a>
                </div>
            </div>
        );
    }

    // Internal Contest Logic
    const now = new Date();
    const isActive = now >= contest.startTime && now <= contest.endTime;
    const isEnded = now > contest.endTime;

    // Check Registration
    const registration: any = await db.contestRegistration.findUnique({
        where: {
            userId_contestId: {
                userId: session.user.id,
                contestId: id
            }
        }
    });

    // Decide what to render
    if (isActive && registration) {
        // If contest has duration, check if user started
        if (contest.duration && !registration.startedAt) {
            // User hasn't started yet -> Show Lobby with Start Button
        } else {
            // User started OR no duration (legacy/auto-start)

            // Calculate deadline
            let deadline = new Date(contest.endTime);
            if (contest.duration && registration.startedAt) {
                const userDeadline = new Date(registration.startedAt.getTime() + contest.duration * 60000);
                // Optional: Cap at contest.endTime if strict. user said "login time", so maybe just userDeadline.
                // Let's take the userDeadline.
                deadline = userDeadline;
            }

            const MAX_SAFE_PROBLEMS = contest.problems.map((p: any) => ({
                ...p,
                createdAt: p.createdAt.toISOString(),
                updatedAt: p.updatedAt.toISOString(),
                testCases: p.testCases.map((tc: any) => ({
                    ...tc,
                }))
            }));

            const safeContest = {
                ...contest,
                startTime: contest.startTime.toISOString(),
                endTime: contest.endTime.toISOString(),
                createdAt: contest.createdAt.toISOString(),
                updatedAt: contest.updatedAt.toISOString(),
                problems: undefined // Don't pass full problems here if not needed or handle separately
            };

            return <ContestPlayer
                contest={safeContest}
                problems={MAX_SAFE_PROBLEMS}
                endTime={deadline.toISOString()}
                onLeave={async () => {
                    "use server";
                    redirect("/contest");
                }}
            />;
        }
    }

    // Otherwise -> LOBBY (Join, Wait, or Ended)
    let leaderboard: any[] | undefined = undefined;
    if (isEnded && contest.type === "INTERNAL") {
        leaderboard = await db.contestRegistration.findMany({
            where: { contestId: id },
            include: { user: true },
            orderBy: [
                { score: "desc" },
            ],
            take: 10,
        });
    }

    // Safe serialization for leaderboard
    const serializedLeaderboard = leaderboard?.map(entry => ({
        ...entry,
        joinedAt: entry.joinedAt.toISOString(),
        startedAt: entry.startedAt ? entry.startedAt.toISOString() : null,
        user: {
            ...entry.user,
            createdAt: entry.user.createdAt.toISOString(),
            updatedAt: entry.user.updatedAt.toISOString(),
            emailVerified: entry.user.emailVerified ? entry.user.emailVerified.toISOString() : null
        }
    }));

    const safeContestForLobby = {
        ...contest,
        startTime: contest.startTime.toISOString(),
        endTime: contest.endTime.toISOString(),
        createdAt: contest.createdAt.toISOString(),
        updatedAt: contest.updatedAt.toISOString(),
        problems: [] // Explicitly remove problems to avoid serialization error
    };

    return <ContestLobby
        contest={safeContestForLobby}
        isRegistered={!!registration}
        leaderboard={serializedLeaderboard}
        hasStarted={!!registration?.startedAt}
        duration={contest.duration ?? undefined}
    />;
}
