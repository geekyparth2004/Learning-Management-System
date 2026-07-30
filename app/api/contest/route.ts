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

// The unauthenticated GET that used to live here was removed: it returned every contest
// of a category to anyone, which bypassed the org-visibility filtering applied elsewhere
// (see lib/org-scope.ts). Nothing consumed it. Pages query the DB directly instead.
