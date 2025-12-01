import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "TEACHER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: courseId } = await params;
        const { list } = await req.json();

        if (!list || !Array.isArray(list)) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        // Update order in transaction
        const transaction = list.map((item: { id: string; order: number }) =>
            db.module.update({
                where: { id: item.id },
                data: { order: item.order },
            })
        );

        await db.$transaction(transaction);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error reordering modules:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
