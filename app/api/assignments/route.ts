import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const title = formData.get("title") as string;
        const problemsJson = formData.get("problems") as string;

        if (!title || !problemsJson) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const problems = JSON.parse(problemsJson);
        const processedProblems = [];

        // Ensure upload directory exists
        const uploadDir = path.join(process.cwd(), "public/uploads/solutions");
        await mkdir(uploadDir, { recursive: true });

        for (let i = 0; i < problems.length; i++) {
            const p = problems[i];
            let videoPath = null;

            // Check if hints contain a video URL (legacy support)
            if (!p.videoSolution && p.hints && Array.isArray(p.hints)) {
                const lastHint = p.hints[p.hints.length - 1];
                if (typeof lastHint === "string" && (lastHint.startsWith("http") || lastHint.startsWith("https"))) {
                    videoPath = lastHint;
                }
            }

            processedProblems.push({
                ...p,
                videoSolution: p.videoSolution || videoPath
            });
        }

        // Create the assignment
        const assignment = await db.assignment.create({
            data: {
                title,
                problems: {
                    create: processedProblems.map((p: any) => ({
                        title: p.title,
                        description: p.description,
                        defaultCode: p.defaultCode,
                        hints: p.hints || "[]",
                        videoSolution: p.videoSolution,
                        leetcodeUrl: p.leetcodeUrl,
                        slug: p.slug,
                        type: p.type || "CODING",
                        mcqOptions: p.mcqOptions ? JSON.stringify(p.mcqOptions) : null,
                        mcqCorrectAnswer: p.mcqCorrectAnswer || null,
                        testCases: {
                            create: p.testCases ? p.testCases.map((tc: any) => ({
                                input: tc.input,
                                expectedOutput: tc.expectedOutput,
                                isHidden: tc.isHidden,
                            })) : [],
                        },
                    })),
                },
            },
        });

        return NextResponse.json(assignment);
    } catch (error) {
        console.error("Error creating assignment:", error);
        return NextResponse.json(
            { error: "Failed to create assignment", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const assignments = await db.assignment.findMany({
            include: {
                problems: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return NextResponse.json(assignments);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch assignments" },
            { status: 500 }
        );
    }
}
