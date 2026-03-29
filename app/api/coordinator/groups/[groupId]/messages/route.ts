import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ groupId: string }> }) {
    const { groupId } = await params;
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

        const group = await db.placementGroup.findUnique({
            where: { id: groupId },
        });

        if (!group || group.organizationId !== user.organizationId) {
            return NextResponse.json({ error: "Group not found or unauthorized" }, { status: 404 });
        }

        const messages = await db.placementGroupMessage.findMany({
            where: { groupId },
            orderBy: { createdAt: "asc" },
            include: {
                user: {
                    select: { name: true, role: true },
                },
            },
        });

        return NextResponse.json({ messages });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ groupId: string }> }) {
    const { groupId: gId } = await params;
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

        const group = await db.placementGroup.findUnique({
            where: { id: gId },
        });

        if (!group || group.organizationId !== user.organizationId) {
            return NextResponse.json({ error: "Group not found or unauthorized" }, { status: 404 });
        }

        const { content, fileUrl, fileName, fileSize } = await req.json();

        if (!content && !fileUrl) {
            return NextResponse.json({ error: "Message content or file is required" }, { status: 400 });
        }

        const message = await db.placementGroupMessage.create({
            data: {
                groupId: gId,
                userId: session.user.id,
                content: content || "",
                fileUrl,
                fileName,
                fileSize,
            },
            include: {
                user: {
                    select: { name: true, role: true },
                },
            },
        });

        return NextResponse.json({ message });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
