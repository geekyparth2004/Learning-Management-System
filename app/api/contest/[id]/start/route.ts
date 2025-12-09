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

        const registration = await db.contestRegistration.findUnique({
            where: {
                userId_contestId: {
                    userId: session.user.id,
                    contestId: id,
                },
            },
        });

        if (!registration) {
            // Auto-register if not registered? Usually Enter Contest implies registering.
            // For now, assume registered or create if missing.
            await db.contestRegistration.create({
                data: {
                    userId: session.user.id,
                    contestId: id,
                    startedAt: new Date(),
                }
            });
        } else if (!registration.startedAt) {
            await db.contestRegistration.update({
                where: {
                    userId_contestId: {
                        userId: session.user.id,
                        contestId: id,
                    },
                },
                data: {
                    startedAt: new Date(),
                },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Start Contest Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
