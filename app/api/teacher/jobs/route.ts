import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET: List all jobs posted by the authenticated teacher
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user || (session.user as any).role !== "TEACHER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const jobs = await (db as any).job.findMany({
            where: { postedById: session.user.id },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(jobs);
    } catch (error) {
        console.error("Error fetching teacher jobs:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Create a new job posting
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || (session.user as any).role !== "TEACHER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { title, company, location, salary, type, description, link, platform } = body;

        if (!title || !company || !location || !link) {
            return NextResponse.json(
                { error: "Title, company, location, and link are required" },
                { status: 400 }
            );
        }

        const job = await (db as any).job.create({
            data: {
                title,
                company,
                location,
                salary: salary || null,
                type: type || "FULL_TIME",
                description: description || null,
                link,
                platform: platform || "Direct",
                postedById: session.user.id,
            },
        });

        return NextResponse.json(job, { status: 201 });
    } catch (error) {
        console.error("Error creating job:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
