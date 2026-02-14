import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const data = await req.json();
        const { problemId, code, language, passed } = data;

        // Check if contest is active
        const contest = await db.contest.findUnique({
            where: { id },
        });

        if (!contest) {
            return NextResponse.json({ error: "Contest not found" }, { status: 404 });
        }

        const now = new Date();
        if (now < contest.startTime || now > contest.endTime) {
            return NextResponse.json({ error: "Contest is not active" }, { status: 403 });
        }

        // Ensure registration
        let registration = await db.contestRegistration.findUnique({
            where: {
                userId_contestId: {
                    userId: session.user.id,
                    contestId: id
                }
            }
        });

        if (!registration) {
            registration = await db.contestRegistration.create({
                data: {
                    userId: session.user.id,
                    contestId: id,
                }
            });
        }

        // Save submission
        const submission = await db.contestSubmission.create({
            data: {
                userId: session.user.id,
                problemId,
                code,
                language,
                status: passed ? "PASSED" : "FAILED",
                passed,
            }
        });

        // Update score if passed and NOT previously passed
        if (passed) {
            const existingPassed = await db.contestSubmission.findFirst({
                where: {
                    userId: session.user.id,
                    problemId,
                    passed: true,
                    id: { not: submission.id } // Exclude current one
                }
            });

            if (!existingPassed) {
                // Determine points (e.g., 100 per problem)
                const points = 100;
                await db.contestRegistration.update({
                    where: { id: registration.id },
                    data: {
                        score: { increment: points }
                    }
                });
            }

            // Update user streak on successful solve
            const { updateUserStreak } = await import("@/lib/streak");
            await updateUserStreak(session.user.id);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error submitting solution:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
