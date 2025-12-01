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
            return NextResponse.json({ error: "Missing module ID" }, { status: 400 });
        }

        // Delete the module
        // Prisma handles cascading deletes if configured in schema, 
        // otherwise we might need to delete items first. 
        // Assuming standard cascade or simple delete for now.
        const deletedModule = await db.module.delete({
            where: {
                id: id,
            },
        });

        return NextResponse.json(deletedModule);
    } catch (error) {
        console.error("Error deleting module:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
