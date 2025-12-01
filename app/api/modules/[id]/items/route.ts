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
        const { title, type, content } = await req.json();

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
        };

        if (type === "VIDEO") {
            itemData.content = content;
        } else if (type === "ASSIGNMENT") {
            // content is expected to be assignmentId
            itemData.assignmentId = content;
        } else if (type === "AI_INTERVIEW") {
            // content is expected to be JSON string: { topic, count }
            try {
                const { topic, count } = JSON.parse(content);
                itemData.aiInterviewTopic = topic;
                itemData.aiQuestionsCount = count;
            } catch (e) {
                return NextResponse.json({ error: "Invalid AI Interview config" }, { status: 400 });
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
                            defaultCode: p.defaultCode || { cpp: "", python: "" },
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
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
