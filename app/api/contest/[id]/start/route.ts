import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Check if registration exists
        const registration = await db.contestRegistration.findUnique({
            where: {
                userId_contestId: {
                    userId: session.user.id,
                    contestId: id
                }
            }
        });

        if (!registration) {
            return NextResponse.json({ error: "Not registered" }, { status: 403 });
        }

        // Check if already started
        if (registration.startedAt) {
            return NextResponse.json({ message: "Already started", startedAt: registration.startedAt });
        }

        // Set startedAt
        const updated = await db.contestRegistration.update({
            where: { id: registration.id },
            data: { startedAt: new Date() }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error starting contest:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
