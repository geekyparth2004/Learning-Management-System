
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { signR2Url } from "@/lib/s3";

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
                },
                moduleItems: {
                    include: {
                        module: true // To get courseId
                    }
                }
            }
        });

        if (!assignment) {
            console.log("[ASSIGNMENT_GET] Not found for id:", id);
            return new NextResponse("Not Found", { status: 404 });
        }

        // Extract courseId from the first module item (assuming context)
        const courseId = assignment.moduleItems[0]?.module?.courseId;

        // Create or get progress to ensure consistent startedAt
        // We use upsert to guarantee a record exists, but we only set startedAt on create
        const progress = await db.assignmentProgress.upsert({
            where: {
                userId_assignmentId: {
                    userId: session.user.id,
                    assignmentId: id
                }
            },
            create: {
                userId: session.user.id,
                assignmentId: id,
                startedAt: new Date()
            },
            update: {} // Do nothing if exists, preserving original startedAt
        });

        // Process problems to sign hint URLs
        const processedProblems = await Promise.all(assignment.problems.map(async (problem) => {
            const hintsRaw = typeof problem.hints === 'string' ? JSON.parse(problem.hints) : (problem.hints || []);
            const processedHints = await Promise.all(hintsRaw.map(async (hintItem: any) => {
                let type = "text";
                let content = "";
                if (typeof hintItem === 'string') {
                    content = hintItem;
                } else {
                    type = hintItem.type || "text";
                    content = hintItem.content || "";
                }

                if (type === "video" && (content.includes("r2.cloudflarestorage.com") || content.includes("backblazeb2.com"))) {
                    content = await signR2Url(content);
                }
                return { type, content };
            }));

            // Sign video solution if exists
            let signedVideoSolution = problem.videoSolution;
            if (problem.videoSolution && (problem.videoSolution.includes("r2.cloudflarestorage.com") || problem.videoSolution.includes("backblazeb2.com"))) {
                signedVideoSolution = await signR2Url(problem.videoSolution);
            }

            return {
                ...problem,
                hints: processedHints, // Return parsed/signed array
                videoSolution: signedVideoSolution
            };
        }));

        return NextResponse.json({
            ...assignment,
            problems: processedProblems,
            courseId,
            startedAt: progress.startedAt
        });
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
                            type: p.type || "CODING",
                            difficulty: p.difficulty || "Medium",
                            slug: p.slug,
                            defaultCode: p.defaultCode,
                            // Replace test cases
                            testCases: {
                                deleteMany: {},
                                create: Array.isArray(p.testCases) ? p.testCases.map((tc: any) => ({
                                    input: tc.input,
                                    expectedOutput: tc.expectedOutput,
                                    isHidden: tc.isHidden || false
                                })) : []
                            },
                            hints: p.hints,
                            videoSolution: p.videoSolution,
                            leetcodeUrl: p.leetcodeUrl,
                            isManualVerification: p.isManualVerification,
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
                            type: p.type || "CODING",
                            difficulty: p.difficulty || "Medium",
                            slug: p.slug,
                            defaultCode: p.defaultCode,
                            testCases: {
                                create: Array.isArray(p.testCases) ? p.testCases.map((tc: any) => ({
                                    input: tc.input,
                                    expectedOutput: tc.expectedOutput,
                                    isHidden: tc.isHidden || false
                                })) : []
                            },
                            hints: p.hints,
                            videoSolution: p.videoSolution,
                            leetcodeUrl: p.leetcodeUrl,
                            isManualVerification: p.isManualVerification,
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
