import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { html, css, js } = await req.json();

        // Update ModuleItemProgress
        await db.moduleItemProgress.upsert({
            where: {
                userId_moduleItemId: {
                    userId: session.user.id,
                    moduleItemId: id,
                },
            },
            update: {
                isCompleted: true,
                completedAt: new Date(),
                webDevSubmission: JSON.stringify({ html, css, js }),
            },
            create: {
                userId: session.user.id,
                moduleItemId: id,
                isCompleted: true,
                completedAt: new Date(),
                webDevSubmission: JSON.stringify({ html, css, js }),
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error submitting web dev assignment:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
