import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(req: Request, { params }: { params: { groupId: string } }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const membership = await db.placementGroupMember.findUnique({
            where: {
                userId_groupId: {
                    userId: session.user.id,
                    groupId: params.groupId,
                }
            }
        });

        if (!membership) {
            return NextResponse.json({ error: "Not a member" }, { status: 403 });
        }

        const messages = await db.placementGroupMessage.findMany({
            where: { groupId: params.groupId },
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

export async function POST(req: Request, { params }: { params: { groupId: string } }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const membership = await db.placementGroupMember.findUnique({
            where: {
                userId_groupId: {
                    userId: session.user.id,
                    groupId: params.groupId,
                }
            }
        });

        if (!membership) {
            return NextResponse.json({ error: "Not a member" }, { status: 403 });
        }

        const { content, fileUrl, fileName, fileSize } = await req.json();

        if (!content && !fileUrl) {
            return NextResponse.json({ error: "Message content or file is required" }, { status: 400 });
        }

        const message = await db.placementGroupMessage.create({
            data: {
                groupId: params.groupId,
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
