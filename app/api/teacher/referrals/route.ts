import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// Fetch teacher's generated referral codes
export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Must be a teacher? You might check session.user.role here if it's in the token
        // For now, we assume if they hit this, they're valid, or we check db role
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        });

        if (user?.role !== "TEACHER" && user?.role !== "ADMIN") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const codes = await db.referralCode.findMany({
            where: {
                teacherId: session.user.id
            },
            include: {
                _count: {
                    select: { users: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(codes);
    } catch (error) {
        console.error("[TEACHER_REFERRALS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// Generate a new referral code
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, name: true }
        });

        if (user?.role !== "TEACHER" && user?.role !== "ADMIN") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Generate a random 6-character alphanumeric code
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        // Add teacher prefix just to guarantee uniqueness or context
        const prefix = user.name ? user.name.substring(0, 3).toUpperCase() : 'TCH';
        const finalCode = `${prefix}-${code}`;

        const newReferral = await db.referralCode.create({
            data: {
                code: finalCode,
                teacherId: session.user.id
            }
        });

        return NextResponse.json(newReferral);
    } catch (error) {
        console.error("[TEACHER_REFERRALS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
