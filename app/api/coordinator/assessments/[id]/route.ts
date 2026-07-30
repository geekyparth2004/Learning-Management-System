import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/** Deletes an assessment, but only one owned by the caller's own organization. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "COORDINATOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { organizationId: true },
        });

        if (!user?.organizationId) {
            return NextResponse.json({ error: "No organization" }, { status: 403 });
        }

        const { id } = await params;
        const target = await db.contest.findUnique({
            where: { id },
            select: { id: true, organizationId: true, category: true },
        });

        if (!target) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        if (target.category !== "ASSESSMENT") {
            return NextResponse.json({ error: "Not an assessment" }, { status: 400 });
        }
        // A global (teacher-created) row has organizationId === null, so this also
        // prevents a TPO from deleting platform-wide assessments.
        if (target.organizationId !== user.organizationId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Cascades to problems and registrations.
        await db.contest.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete coordinator assessment", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
