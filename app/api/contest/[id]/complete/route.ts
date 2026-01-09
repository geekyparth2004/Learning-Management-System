
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const contestId = params.id;

        // Update registration
        await db.contestRegistration.update({
            where: {
                userId_contestId: {
                    userId: session.user.id,
                    contestId: contestId
                }
            },
            data: {
                completedAt: new Date()
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to complete contest", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
