import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

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

        // Check if contest is active or upcoming
        const contest = await db.contest.findUnique({
            where: { id },
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

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error joining contest:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
