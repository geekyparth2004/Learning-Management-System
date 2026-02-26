import { NextResponse } from "next/server";
import { getUserBadges } from "@/lib/badges";

export async function GET() {
    try {
        const userId = "cmipqlrfe000awpjht3jytlhs"; // User with HTML_COMPLETION

        const badges = await getUserBadges(userId);
        const earnedBadgeTypes = new Set(badges.map((b: { id: string }) => b.id));

        return NextResponse.json({
            badges,
            earnedBadgeTypes: Array.from(earnedBadgeTypes),
            hasHtmlBadge: earnedBadgeTypes.has("HTML_COMPLETION")
        });
    } catch (error) {
        console.error("Error checking badges:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
