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

        const { id: moduleItemId } = await params;
        const userId = session.user.id;

        // Check if already started
        const existingProgress = await db.moduleItemProgress.findUnique({
            where: {
                userId_moduleItemId: {
                    userId,
                    moduleItemId,
                },
            },
        });

        if (existingProgress?.startedAt) {
            return NextResponse.json({ success: true, startedAt: existingProgress.startedAt });
        }

        // Create or update with startedAt
        const progress = await db.moduleItemProgress.upsert({
            where: {
                userId_moduleItemId: {
                    userId,
                    moduleItemId,
                },
            },
            update: {
                startedAt: new Date(),
            },
            create: {
                userId,
                moduleItemId,
                startedAt: new Date(),
            },
        });

        return NextResponse.json({ success: true, startedAt: progress.startedAt });
    } catch (error) {
        console.error("Error starting item:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
