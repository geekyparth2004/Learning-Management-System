import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cacheDelete, CACHE_KEYS } from "@/lib/redis";

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: {
                subscriptionStatus: true,
                trialExpiresAt: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.subscriptionStatus === "PAID") {
            return NextResponse.json({ error: "User already has a paid subscription." }, { status: 400 });
        }

        if (user.subscriptionStatus === "TRIAL" && user.trialExpiresAt && user.trialExpiresAt > new Date()) {
            return NextResponse.json({ error: "User already has an active trial." }, { status: 400 });
        }

        const trialExpiresAt = new Date();
        trialExpiresAt.setDate(trialExpiresAt.getDate() + 1);

        await db.user.update({
            where: { id: session.user.id },
            data: {
                subscriptionStatus: "TRIAL",
                trialExpiresAt: trialExpiresAt,
            }
        });

        // Invalidate subscription cache so the frontend guard redirects immediately
        await cacheDelete(CACHE_KEYS.userSubscription(session.user.id));

        return NextResponse.json({ success: true, message: "Trial started successfully." });

    } catch (error) {
        console.error("START_TRIAL_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
