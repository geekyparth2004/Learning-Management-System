import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cacheGetOrSet, CACHE_KEYS, CACHE_TTL } from "@/lib/redis";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(null);
        }
        const userId = session.user.id;

        const user = await cacheGetOrSet(
            CACHE_KEYS.userSubscription(userId),
            async () => {
                return db.user.findUnique({
                    where: { id: userId },
                    select: {
                        role: true,
                        subscriptionStatus: true,
                        trialExpiresAt: true
                    }
                });
            },
            CACHE_TTL.SHORT // Cache for 1 minute
        );

        return NextResponse.json(user);
    } catch (error) {
        console.error("[USER_SUBSCRIPTION_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
