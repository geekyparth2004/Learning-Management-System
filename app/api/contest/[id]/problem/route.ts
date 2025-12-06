import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (session?.user?.role !== "TEACHER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const data = await req.json();
        const { title, description, type, testCases, webDevInstructions, webDevInitialCode, leetcodeUrl } = data;

        const problem = await db.contestProblem.create({
            data: {
                contestId: id,
                title,
                description, // For LeetCode, this is the URL (based on builder logic) or description
                difficulty: "Medium", // Default
                slug: title.toLowerCase().replace(/ /g, "-"),
                defaultCode: webDevInitialCode ? JSON.stringify(webDevInitialCode) : null,
                testCases: {
                    create: testCases?.map((tc: any) => ({
                        input: tc.input,
                        expectedOutput: tc.expectedOutput,
                        isHidden: tc.isHidden || false,
                    })) || [],
                },
            },
        });

        return NextResponse.json(problem);
    } catch (error) {
        console.error("Error creating contest problem:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (session?.user?.role !== "TEACHER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const problemId = url.searchParams.get("problemId");

        if (!problemId) {
            return NextResponse.json({ error: "Missing problem ID" }, { status: 400 });
        }

        await db.contestProblem.delete({
            where: { id: problemId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting contest problem:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
