import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(null);
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: {
                role: true,
                subscriptionStatus: true,
                trialExpiresAt: true
            }
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("[USER_SUBSCRIPTION_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
