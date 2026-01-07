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
            select: { codolioUsername: true }
        });

        if (!user?.codolioUsername) {
            return NextResponse.json({ error: "Codolio username not linked" }, { status: 400 });
        }

        const stats = await fetchCodolioStats(user.codolioUsername);

        if (!stats) {
            return NextResponse.json({ error: "Failed to fetch stats from Codolio" }, { status: 500 });
        }

        await db.user.update({
            where: { id: session.user.id },
            data: {
                externalRatings: stats as any
            }
        });

        return NextResponse.json({ success: true, stats });

    } catch (error) {
        console.error("Refresh Stats Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
