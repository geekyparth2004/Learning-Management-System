import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { fetchCodolioStats } from "@/lib/codolio";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { codolioUsername: true, codolioBaseline: true, id: true }
        });

        if (!user?.codolioUsername) {
            return NextResponse.json({ error: "Codolio username not linked" }, { status: 400 });
        }

        const stats = await fetchCodolioStats(user.codolioUsername);

        if (!stats) {
            return NextResponse.json({ error: "Failed to fetch stats from Codolio" }, { status: 500 });
        }
        // Update cache and baseline
        const updateData: any = {
            externalRatings: stats,
            lastUpdated: new Date()
        };

        if (user.codolioBaseline === null) {
            updateData.codolioBaseline = stats.totalQuestions;
        }

        await db.user.update({
            where: { id: user.id },
            data: updateData
        });

        return NextResponse.json({ success: true, stats });

    } catch (error: any) {
        console.error("Leaderboard Refresh Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
