import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (session?.user?.role !== "TEACHER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await req.json();
        const { title, description, type, testCases, hints, videoSolution, leetcodeUrl, webDevInstructions, webDevInitialCode, isManualVerification } = data;

        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const problem = await db.problem.create({
            data: {
                title,
                description: description || "",
                difficulty: "Medium", // Or accept from payload
                isPractice: true,
                defaultCode: webDevInitialCode ? JSON.stringify({ isWebDev: true, ...webDevInitialCode }) : JSON.stringify({ python: "", cpp: "", java: "" }),
                hints: hints ? JSON.stringify(hints) : "[]",
                videoSolution,
                leetcodeUrl,
                isManualVerification: isManualVerification || false,
                testCases: {
                    create: testCases?.map((tc: any) => ({
                        input: tc.input,
                        expectedOutput: tc.expectedOutput,
                        isHidden: tc.isHidden || false
                    })) || []
                }
            }
        });

        return NextResponse.json(problem);
    } catch (error) {
        console.error("Error creating practice problem:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const problems = await db.problem.findMany({
            where: { isPractice: true },
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { submissions: true }
                }
            }
        });

        return NextResponse.json(problems);
    } catch (error) {
        console.error("Error fetching practice problems:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
