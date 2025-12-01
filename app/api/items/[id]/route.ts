import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "TEACHER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "Missing item ID" }, { status: 400 });
        }

        // Delete the item
        const deletedItem = await db.moduleItem.delete({
            where: {
                id: id,
            },
        });

        return NextResponse.json(deletedItem);
    } catch (error) {
        console.error("Error deleting item:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
