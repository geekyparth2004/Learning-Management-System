import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { signR2Url } from "@/lib/s3";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { url } = await request.json();
        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        const signedUrl = await signR2Url(url);

        return NextResponse.json({ signedUrl });

    } catch (error: any) {
        console.error("Sign URL error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
