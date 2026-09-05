import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// DELETE: Remove a job (only by the teacher who posted it)
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user || (session.user as any).role !== "TEACHER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Verify ownership
        const job = await (db as any).job.findUnique({ where: { id } });
        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }
        if (job.postedById !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await (db as any).job.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting job:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PUT: Update a job (only by the teacher who posted it)
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user || (session.user as any).role !== "TEACHER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Verify ownership
        const existing = await (db as any).job.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }
        if (existing.postedById !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { title, company, location, salary, type, description, link, platform } = body;

        const updated = await (db as any).job.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(company && { company }),
                ...(location && { location }),
                ...(salary !== undefined && { salary: salary || null }),
                ...(type && { type }),
                ...(description !== undefined && { description: description || null }),
                ...(link && { link }),
                ...(platform && { platform }),
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating job:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
