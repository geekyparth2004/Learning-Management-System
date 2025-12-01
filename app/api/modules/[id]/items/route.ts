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
