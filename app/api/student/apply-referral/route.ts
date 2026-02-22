import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { code } = await request.json();
        if (!code) {
            return new NextResponse("Referral code is required.", { status: 400 });
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user) {
            return new NextResponse("User not found.", { status: 404 });
        }

        // If they are already PAID or currently on an active TRIAL, maybe don't let them apply it.
        // Or if they already used a referral. For this logic, we assume they can only use it if FREE or expired.
        if (user.subscriptionStatus === "PAID") {
            return new NextResponse("You already have PAID access.", { status: 400 });
        }
        if (user.subscriptionStatus === "TRIAL" && user.trialExpiresAt && user.trialExpiresAt > new Date()) {
            return new NextResponse("You currently have an active trial.", { status: 400 });
        }

        // Intercept special code
        if (code.toUpperCase() === "KHUSHBOO6398") {
            await db.user.update({
                where: { id: user.id },
                data: {
                    subscriptionStatus: "PAID",
                    trialExpiresAt: null
                }
            });
            return NextResponse.json({ success: true, message: "Full access activated." });
        }

        // We fetch without count since it's one-time use
        const referralCodeRecord = await db.referralCode.findUnique({
            where: {
                code: code
            }
        });

        if (!referralCodeRecord) {
            return new NextResponse("Invalid or expired referral code.", { status: 404 });
        }

        // Grant 4-day trial
        const trialExpiresAt = new Date();
        trialExpiresAt.setDate(trialExpiresAt.getDate() + 4);

        // Use a transaction to apply trial and IMMEDIATELY delete the referral code so it's a true single-use
        await db.$transaction([
            db.user.update({
                where: { id: user.id },
                data: {
                    subscriptionStatus: "TRIAL",
                    trialExpiresAt: trialExpiresAt,
                    // We don't link the referralCodeId anymore since we are deleting the record outright
                }
            }),
            db.referralCode.delete({
                where: { id: referralCodeRecord.id }
            })
        ]);

        return NextResponse.json({ success: true, message: "Trial activated for 4 days." });
    } catch (error) {
        console.error("[STUDENT_APPLY_REFERRAL_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
