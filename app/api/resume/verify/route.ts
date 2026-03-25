import { NextResponse } from "next/server";
import crypto from "crypto";
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

        // Return success, the frontend will then show the form to collect resume details
        return NextResponse.json({ success: true, message: "Resume drafting payment verified." });
    } catch (error) {
        console.error("Razorpay resume verification error:", error);
        return new NextResponse("Internal server verification error", { status: 500 });
    }
}
