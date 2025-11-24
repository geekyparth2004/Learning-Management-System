import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // 1. Get all assignments
        const allAssignments = await db.assignment.findMany({
            select: { id: true },
        });

        // 2. Get all accepted submissions for this user
        const solvedSubmissions = await db.submission.findMany({
            where: {
                userId: userId,
                status: "ACCEPTED",
            },
            select: {
                problem: {
                    select: {
                        assignmentId: true,
                    },
                },
            },
        });

        // Extract solved assignment IDs
        const solvedAssignmentIds = new Set(
            solvedSubmissions.map((s) => s.problem.assignmentId)
        );

        // 3. Filter for unsubmitted assignments
        const unsubmittedAssignments = allAssignments.filter(
            (a) => !solvedAssignmentIds.has(a.id)
        );

        if (unsubmittedAssignments.length === 0) {
            return NextResponse.json({ message: "No more questions" });
        }

        // 4. Pick a random one
        const randomIndex = Math.floor(Math.random() * unsubmittedAssignments.length);
        const randomAssignment = unsubmittedAssignments[randomIndex];

        return NextResponse.json({ assignmentId: randomAssignment.id });

    } catch (error) {
        console.error("Focus mode error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
