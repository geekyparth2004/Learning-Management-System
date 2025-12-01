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
        const { title, timeLimit } = await req.json();

        if (!title || !timeLimit) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Get highest order
        const lastModule = await db.module.findFirst({
            where: { courseId: id },
            orderBy: { order: "desc" },
        });

        const newOrder = lastModule ? lastModule.order + 1 : 0;

        const module = await db.module.create({
            data: {
                title,
                timeLimit,
                courseId: id,
                order: newOrder,
            },
        });

        return NextResponse.json(module);
    } catch (error) {
        console.error("Error creating module:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
