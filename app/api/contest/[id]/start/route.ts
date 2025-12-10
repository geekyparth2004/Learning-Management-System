import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const userId = session.user.id;

        // Check registration
        const registration = await db.contestRegistration.findUnique({
            where: {
                userId_contestId: {
                    userId,
                    contestId: id
                }
            }
        });

        if (!registration) {
            return NextResponse.json({ error: "Not registered" }, { status: 400 });
        }

        // If not started, start now
        if (!registration.startedAt) {
            await db.contestRegistration.update({
                where: { id: registration.id },
                data: { startedAt: new Date() }
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error starting contest:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
