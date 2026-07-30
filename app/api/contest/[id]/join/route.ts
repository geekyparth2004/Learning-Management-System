import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { CACHE_KEYS, cacheDelete } from "@/lib/redis";
import { viewerOrgId, visibleContestWhere } from "@/lib/org-scope";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Org-scoped lookup: a student cannot register for another organization's
        // assessment even by POSTing the id directly.
        const orgId = await viewerOrgId(session.user.id);
        const contest = await db.contest.findFirst({
            where: { id, ...visibleContestWhere(orgId) },
        });

        if (!contest) {
            return NextResponse.json({ error: "Contest not found" }, { status: 404 });
        }

        // Check if already registered
        const existing = await db.contestRegistration.findUnique({
            where: {
                userId_contestId: {
                    userId: session.user.id,
                    contestId: id
                }
            }
        });

        if (existing) {
            return NextResponse.json({ message: "Already joined" });
        }

        await db.contestRegistration.create({
            data: {
                userId: session.user.id,
                contestId: id,
            }
        });
        await cacheDelete(CACHE_KEYS.studentDashboard(session.user.id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error joining contest:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
