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
    const contest = await db.contest.findUnique({
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
    const registration = await db.contestRegistration.findUnique({
        where: {
            userId_contestId: {
                userId: session.user.id,
                contestId: id
            }
        }
    });

    // Decide what to render
    if (isActive && registration) {
        const MAX_SAFE_PROBLEMS = contest.problems.map((p: any) => ({
            ...p,
            testCases: p.testCases.map((tc: any) => ({
                ...tc,
            }))
        }));

        return <ContestPlayer contest={contest} problems={MAX_SAFE_PROBLEMS} endTime={contest.endTime} onLeave={async () => {
            "use server";
            redirect("/contest");
        }} />;
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

    return <ContestLobby contest={contest} isRegistered={!!registration} leaderboard={leaderboard} />;
}
