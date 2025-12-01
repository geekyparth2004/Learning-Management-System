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
        const userId = session.user.id;

        const progress = await db.moduleProgress.findUnique({
            where: { userId_moduleId: { userId, moduleId: id } },
        });

        if (!progress) {
            return NextResponse.json({ error: "Module locked" }, { status: 403 });
        }

        if (progress.startedAt) {
            return NextResponse.json({ message: "Already started" });
        }

        await db.moduleProgress.update({
            where: { id: progress.id },
            data: { startedAt: new Date() },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error starting module:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
