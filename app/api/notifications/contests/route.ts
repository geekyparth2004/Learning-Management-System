
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { viewerOrgId, visibleContestWhere } from "@/lib/org-scope";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await auth();
        // Anonymous callers get an empty feed rather than a 401, so NotificationBell
        // degrades quietly instead of surfacing an error.
        if (!session?.user?.id) {
            return NextResponse.json([]);
        }

        const orgId = await viewerOrgId(session.user.id);

        // 5 most recent contests/hackathons/assessments this viewer is allowed to see
        const notifications = await db.contest.findMany({
            where: visibleContestWhere(orgId),
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                title: true,
                category: true,
                createdAt: true,
                startTime: true
            }
        });

        return NextResponse.json(notifications);
    } catch (error) {
        console.error("Error fetching contest notifications:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
