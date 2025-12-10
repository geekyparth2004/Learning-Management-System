
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // Fetch 5 most recent contests/hackathons
        const notifications = await db.contest.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                title: true,
                category: true, // CONTEST or HACKATHON
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
