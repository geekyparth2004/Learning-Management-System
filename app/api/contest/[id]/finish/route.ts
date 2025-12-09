import { db } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

        const { id } = await params;

        // Mark registration as completed
        await db.contestRegistration.update({
            where: {
                userId_contestId: {
                    userId: session.user.id,
                    contestId: id
                }
            },
            data: {
                completedAt: new Date()
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.log("[CONTEST_FINISH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
