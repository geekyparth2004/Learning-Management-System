import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
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

        const groups = await db.placementGroup.findMany({
            where: {
                organizationId: user.organizationId,
            },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: { user: { select: { name: true, role: true } } },
                },
                _count: { select: { members: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ groups });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
