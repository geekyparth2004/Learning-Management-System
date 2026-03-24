import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { organizationId: true },
        });

        if (!user?.organizationId) {
            return NextResponse.json({ error: "Not an organization student" }, { status: 403 });
        }

        const groups = await db.placementGroup.findMany({
            where: { organizationId: user.organizationId },
            include: {
                _count: { select: { members: true } },
                members: {
                    where: { userId: session.user.id },
                    select: { id: true },
                },
                drive: {
                    select: { company: true, role: true, status: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const groupsWithMembership = groups.map((group) => ({
            id: group.id,
            name: group.name,
            description: group.description || (group.drive ? `${group.drive.company} - ${group.drive.role}` : null),
            icon: group.icon,
            color: group.color,
            memberCount: group._count.members,
            isMember: group.members.length > 0,
        }));

        return NextResponse.json({ groups: groupsWithMembership });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
