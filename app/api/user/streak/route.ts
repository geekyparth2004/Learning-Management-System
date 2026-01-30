import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserStreak } from "@/lib/streak";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { streak, lastActivityDate } = await getUserStreak(session.user.id);

        return NextResponse.json({ streak, lastActivityDate });
    } catch (error) {
        console.error("Error fetching streak:", error);
        return NextResponse.json({ error: "Failed to fetch streak" }, { status: 500 });
    }
}
