import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

        const { searchParams } = new URL(req.url);
        const start = searchParams.get("start");
        const end = searchParams.get("end");

        const where: any = {};

        if (start && end) {
            where.startTime = {
                gte: new Date(start),
                lte: new Date(end)
            };
        } else {
            // Default to future events if no range
            where.endTime = {
                gte: new Date()
            };
        }

        const events = await db.contest.findMany({
            where,
            orderBy: { startTime: 'asc' }
        });

        return NextResponse.json(events);
    } catch (error) {
        console.error("[EVENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
