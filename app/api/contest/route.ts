import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (session?.user?.role !== "TEACHER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await req.json();
        const { title, description, type, startTime, endTime, platformName, contestLink } = data;

        if (!title || !startTime || !endTime || !type) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const contest = await db.contest.create({
            data: {
                title,
                description,
                type,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                platformName: type === "EXTERNAL" ? platformName : null,
                contestLink: type === "EXTERNAL" ? contestLink : null,
            },
        });

        return NextResponse.json(contest);
    } catch (error) {
        console.error("Error creating contest:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
