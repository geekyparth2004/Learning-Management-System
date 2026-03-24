import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const profile = await db.placementProfile.findUnique({
            where: { userId: session.user.id },
        });

        return NextResponse.json({ profile });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { cgpa, batch, department, degree, resumeUrl, resumeName } = await req.json();

        const profile = await db.placementProfile.upsert({
            where: { userId: session.user.id },
            update: { cgpa, batch, department, degree, resumeUrl, resumeName },
            create: {
                userId: session.user.id,
                cgpa,
                batch,
                department,
                degree,
                resumeUrl,
                resumeName,
            },
        });

        return NextResponse.json({ profile });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
