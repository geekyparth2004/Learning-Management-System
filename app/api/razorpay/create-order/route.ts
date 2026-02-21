import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { auth } from "@/auth";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID as string,
            key_secret: process.env.RAZORPAY_KEY_SECRET as string,
        });

        const options = {
            amount: 399900, // amount in the smallest currency unit (paise for INR, so 3999 * 100)
            currency: "INR",
            receipt: `rcpt_${session.user.id.slice(0, 10)}_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        if (!order || !order.id) {
            return new NextResponse("Error generating order payload", { status: 500 });
        }

        return NextResponse.json({
            order_id: order.id,
            amount: options.amount,
            currency: options.currency,
            key_id: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error("Razorpay order creation error:", error);
        return new NextResponse("Internal server checkout error", { status: 500 });
    }
}
