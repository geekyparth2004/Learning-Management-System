import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user) {
            return new NextResponse("User not found.", { status: 404 });
        }

        if (user.subscriptionStatus === "PAID") {
            return new NextResponse("You already have PAID access.", { status: 400 });
        }

        // Mock payment successful:
        // Upgrade to PAID status
        await db.user.update({
            where: { id: user.id },
            data: {
                subscriptionStatus: "PAID",
                // Reset trial info since they bought it
                trialExpiresAt: null
            }
        });

        return NextResponse.json({ success: true, message: "Payment successful. Account upgraded." });
    } catch (error) {
        console.error("[STUDENT_PAY_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
