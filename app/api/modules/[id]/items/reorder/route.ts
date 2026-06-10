import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { cacheDelete, CACHE_KEYS } from "@/lib/redis";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "TEACHER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: moduleId } = await params;
        const { list } = await req.json();

        if (!list || !Array.isArray(list)) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        // Fetch module's course ID to invalidate the correct cache
        const moduleObj = await db.module.findUnique({
            where: { id: moduleId },
            select: { courseId: true }
        });

        // Update order in transaction
        const transaction = list.map((item: { id: string; order: number }) =>
            db.moduleItem.update({
                where: { id: item.id },
                data: { order: item.order },
            })
        );

        await db.$transaction(transaction);

        if (moduleObj) {
            await cacheDelete(CACHE_KEYS.course(moduleObj.courseId));
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error reordering items:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
