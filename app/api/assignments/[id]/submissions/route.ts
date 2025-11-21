import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        // Only teachers can view submissions
        if (!session || !session.user || session.user.role !== "TEACHER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Get all submissions for problems in this assignment
        const assignment = await db.assignment.findUnique({
            where: { id },
            include: {
                problems: {
                    include: {
                        submissions: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                            orderBy: {
                                createdAt: "desc",
                            },
                        },
                    },
                },
            },
        });

        if (!assignment) {
            return NextResponse.json(
                { error: "Assignment not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(assignment);
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: assignmentId } = await params;
        const { code, language, passed } = await request.json();

        // Get the first problem of the assignment (assuming one problem per assignment)
        const assignment = await db.assignment.findUnique({
            where: { id: assignmentId },
            include: { problems: true },
        });

        if (!assignment || assignment.problems.length === 0) {
            return NextResponse.json(
                { error: "Assignment not found" },
                { status: 404 }
            );
        }

        const problemId = assignment.problems[0].id;

        // Create submission
        const submission = await db.submission.create({
            data: {
                userId: session.user.id,
                problemId,
                code,
                language,
                status: passed ? "ACCEPTED" : "WRONG_ANSWER",
            },
        });

        // Reset the timer by updating startedAt to current time
        await db.assignmentProgress.updateMany({
            where: {
                userId: session.user.id,
                assignmentId: assignmentId,
            },
            data: {
                startedAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            submission,
            message: "Timers have been reset"
        });
    } catch (error) {
        console.error("Submission error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
