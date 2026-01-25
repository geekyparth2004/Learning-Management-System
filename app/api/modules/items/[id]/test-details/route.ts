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

        const { id: itemId } = await params;

        // Fetch the module item with test problems
        const item = await db.moduleItem.findUnique({
            where: { id: itemId },
            include: {
                testProblems: {
                    include: {
                        testCases: true
                    }
                }
            }
        });

        if (!item) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }

        // Return test problems data
        const response = NextResponse.json({
            testProblems: item.testProblems || [],
            content: item.content // Include content which has test metadata
        });

        // Cache for 5 minutes since test problems don't change often
        response.headers.set('Cache-Control', 'private, max-age=300');

        return response;
    } catch (error) {
        console.error("Error fetching test details:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
