import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserBadges } from "@/lib/badges";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const badges = await getUserBadges(session.user.id);

        return NextResponse.json({ badges });
    } catch (error) {
        console.error("Error fetching badges:", error);
        return NextResponse.json({ error: "Failed to fetch badges" }, { status: 500 });
    }
}
