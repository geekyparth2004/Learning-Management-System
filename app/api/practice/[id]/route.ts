import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const problem = await db.problem.findUnique({
            where: { id },
            include: {
                testCases: true // Include test cases for the player
            }
        });

        if (!problem) {
            return NextResponse.json({ error: "Problem not found" }, { status: 404 });
        }

        // Must ensure hidden test cases are not revealed if we care about cheating,
        // but existing TestPlayer runs tests server-side?
        // Wait, TestPlayer.tsx uses /api/compile which runs code.
        // It also receives `problems` prop with testCases.
        // In TestPlayer, testCases are displayed in the UI:
        // {activeProblem.testCases.map((tc, idx) => (... Input: {tc.input} ... Expected: {tc.expectedOutput} ...))}
        // So for practice/assignments, test cases ARE exposed to the client in this platform's design.
        // So sending them is fine.

        return NextResponse.json(problem);
    } catch (error) {
        console.error("Error fetching practice problem:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
