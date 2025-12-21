
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

        const { id } = await params;
        console.log("[ASSIGNMENT_GET] Fetching id:", id);

        const assignment = await db.assignment.findUnique({
            where: { id },
            include: {
                problems: {
                    orderBy: { order: 'asc' },
                    include: {
                        testCases: true
                    }
                }
            }
        });

        if (!assignment) {
            console.log("[ASSIGNMENT_GET] Not found for id:", id);
            return new NextResponse("Not Found", { status: 404 });
        }

        return NextResponse.json(assignment);
    } catch (error) {
        console.error("[ASSIGNMENT_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

        const { id } = await params;
        const { title, problems } = await req.json();

        // Transaction to update assignment and sync problems
        await db.$transaction(async (tx) => {
            // 1. Update Assignment Details
            await tx.assignment.update({
                where: { id },
                data: { title }
            });

            // 2. Sync Problems
            // Strategy: Delete all existing problems and re-create them. 
            // Better Strategy: Update existing if ID matches, delete missing, create new.
            // But since "problems" from frontend often lack IDs if they are new or modified copies, simpler might be re-creation 
            // OR if we want to preserve submissions, we MUST keep existing IDs.

            // Let's check if we can rely on frontend sending IDs.
            // Assuming the UI will send 'id' for existing problems.

            // Get existing IDs
            const existingProblems = await tx.problem.findMany({
                where: { assignmentId: id },
                select: { id: true }
            });
            const existingIds = existingProblems.map(p => p.id);
            const incomingIds = problems.filter((p: any) => p.id).map((p: any) => p.id);

            // Delete problems that are not in the incoming list
            const toDelete = existingIds.filter(pid => !incomingIds.includes(pid));
            if (toDelete.length > 0) {
                await tx.problem.deleteMany({
                    where: { id: { in: toDelete } }
                });
            }

            // Upsert incoming problems
            for (let i = 0; i < problems.length; i++) {
                const p = problems[i];
                if (p.id) {
                    // Update existing
                    await tx.problem.update({
                        where: { id: p.id },
                        data: {
                            title: p.title,
                            description: p.description,
                            type: "CODING", // Enforce CODING type for assignments? Or p.type? Assignments usually coding.
                            difficulty: p.difficulty || "Medium",
                            slug: p.slug,
                            defaultCode: p.defaultCode,
                            testCases: p.testCases, // JSON
                            hints: p.hints,
                            videoSolution: p.videoSolution,
                            leetcodeUrl: p.leetcodeUrl,
                            order: i
                        }
                    });
                } else {
                    // Create new
                    await tx.problem.create({
                        data: {
                            assignmentId: id,
                            title: p.title,
                            description: p.description,
                            type: "CODING",
                            difficulty: p.difficulty || "Medium",
                            slug: p.slug,
                            defaultCode: p.defaultCode,
                            testCases: p.testCases,
                            hints: p.hints,
                            videoSolution: p.videoSolution,
                            leetcodeUrl: p.leetcodeUrl,
                            order: i
                        }
                    });
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[ASSIGNMENT_UPDATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
