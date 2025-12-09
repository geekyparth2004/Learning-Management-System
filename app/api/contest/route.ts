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
        const { title, description, type, startTime, endTime, duration, platformName, contestLink, category } = data;

        if (!title || !startTime || !endTime || !type) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const contest = await db.contest.create({
            data: {
                title,
                description,
                type,
                category: category || "CONTEST",
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                duration: duration ? parseInt(duration) : null,
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

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const category = url.searchParams.get("category") || "CONTEST";

        const contests = await db.contest.findMany({
            where: {
                category: category
            },
            orderBy: {
                startTime: "asc",
            },
        });

        return NextResponse.json(contests);
    } catch (error) {
        console.error("Error fetching contests:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
