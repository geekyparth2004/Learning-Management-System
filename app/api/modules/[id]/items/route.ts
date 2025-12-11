import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "TEACHER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { title, type, content, duration } = await req.json();

        if (!title || !type) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Get highest order
        const lastItem = await db.moduleItem.findFirst({
            where: { moduleId: id },
            orderBy: { order: "desc" },
        });

        const newOrder = lastItem ? lastItem.order + 1 : 0;

        const itemData: any = {
            title,
            type,
            moduleId: id,
            order: newOrder,
            duration: duration ? parseInt(duration) * 60 : 0, // Convert minutes to seconds
        };

        if (type === "VIDEO") {
            itemData.content = content;
        } else if (type === "LEETCODE") {
            try {
                const { leetcodeUrl, videoSolution } = JSON.parse(content);

                const assignment = await db.assignment.create({
                    data: {
                        title: title,
                        problems: {
                            create: {
                                title: title,
                                description: "LeetCode Problem",
                                leetcodeUrl: leetcodeUrl,
                                videoSolution: videoSolution,
                                difficulty: "Medium"
                            }
                        }
                    }
                });

                itemData.assignmentId = assignment.id;
            } catch (e) {
                // Fallback: treat content as direct URL (legacy)
                itemData.content = content;
            }
        } else if (type === "ASSIGNMENT") {
            // content is expected to be assignmentId
            itemData.assignmentId = content;
        } else if (type === "AI_INTERVIEW") {
            // content is expected to be JSON string: { topic, count }
            try {
                const { topic, count, difficulty } = JSON.parse(content);
                itemData.aiInterviewTopic = topic;
                itemData.aiQuestionsCount = count;
                itemData.aiDifficulty = difficulty || "Medium";
            } catch (e) {
                return NextResponse.json({ error: "Invalid AI Interview config" }, { status: 400 });
            }
        } else if (type === "WEB_DEV") {
            // content is expected to be JSON string: { instructions, initialCode, videoSolution }
            try {
                const { instructions, initialCode, videoSolution } = JSON.parse(content);
                itemData.webDevInstructions = instructions;
                itemData.webDevInitialCode = JSON.stringify(initialCode);
                // We'll store videoSolution in the content field as a JSON string since there's no dedicated column
                // Or we can add a column. But wait, itemData.content is overwritten below if we don't set it.
                // Actually, for WEB_DEV, content IS the JSON string.
                // The DB schema has webDevInstructions and webDevInitialCode columns, but content column is also there.
                // Let's check how it's used.
                // In the frontend player, it uses webDevInstructions/InitialCode columns.
                // But we are passing `content` as JSON string from frontend.
                // The backend parses it and sets specific columns.
                // But `content` column is also set?
                // Let's look at lines 92-94: `const item = await db.moduleItem.create({ data: itemData });`
                // `itemData` has `webDevInstructions` etc.
                // Does it have `content`?
                // Lines 37-38 set `content` for VIDEO/LEETCODE.
                // For WEB_DEV, `content` is NOT set in `itemData` in the original code.
                // So we need to store `videoSolution` somewhere.
                // Since we don't have a column, and `content` is available (and unused for WEB_DEV in DB?), we can use `content` to store the video URL.
                // OR we can just store the whole JSON in `content` as a backup/extensibility.
                // Let's store the video URL in `content` field for WEB_DEV items.
                itemData.content = videoSolution;
            } catch (e) {
                return NextResponse.json({ error: "Invalid Web Dev config" }, { status: 400 });
            }
        } else if (type === "TEST") {
            // content is expected to be JSON string: { duration, passingScore, problems }
            // problems is array of { title, description, testCases: [...] }
            try {
                const { duration, passingScore, problems } = JSON.parse(content);
                itemData.testDuration = duration;
                itemData.testPassingScore = passingScore;

                // We need to create problems. This is tricky in a single create call unless we use nested creates.
                // Prisma supports nested creates.
                if (problems && Array.isArray(problems)) {
                    itemData.testProblems = {
                        create: problems.map((p: any) => ({
                            title: p.title,
                            description: p.description,
                            defaultCode: JSON.stringify(p.defaultCode || { cpp: "", python: "" }),
                            testCases: {
                                create: p.testCases.map((tc: any) => ({
                                    input: tc.input,
                                    expectedOutput: tc.expectedOutput,
                                    isHidden: tc.isHidden || false
                                }))
                            }
                        }))
                    };
                }
            } catch (e) {
                return NextResponse.json({ error: "Invalid Test config" }, { status: 400 });
            }
        }

        const item = await db.moduleItem.create({
            data: itemData,
        });

        return NextResponse.json(item);
    } catch (error) {
        console.error("Error creating item:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
