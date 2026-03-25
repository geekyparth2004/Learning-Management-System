import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { name, email, contact, resumeUrl } = await req.json();

        if (!name || !email || !contact || !resumeUrl) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const resumeRequest = await db.resumeRequest.create({
            data: {
                userId: session.user.id,
                name,
                email,
                contact,
                resumeUrl
            }
        });

        return NextResponse.json({ success: true, resumeRequest });
    } catch (error) {
        console.error("Resume request submission error:", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
