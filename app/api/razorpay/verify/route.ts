import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return new NextResponse("Missing parameters", { status: 400 });
        }

        // Signature verification
        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (!isAuthentic) {
            return new NextResponse("Invalid security signature", { status: 400 });
        }

        // Signature is valid, update user subscription status securely
        await db.user.update({
            where: { id: session.user.id },
            data: {
                subscriptionStatus: "PAID",
                trialExpiresAt: null // wipe trial info if they successfully bought lifetime access
            }
        });

        return NextResponse.json({ success: true, message: "Payment verified and upgraded." });
    } catch (error) {
        console.error("Razorpay signature verification error:", error);
        return new NextResponse("Internal server verification error", { status: 500 });
    }
}
