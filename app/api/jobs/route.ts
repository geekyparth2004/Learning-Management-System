
import { NextResponse } from "next/server";
import { getRecommendedJobs } from "@/lib/jobs";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const jobs = await getRecommendedJobs();
        return NextResponse.json(jobs);
    } catch (error) {
        console.error("Error in jobs API:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
