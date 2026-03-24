import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "COORDINATOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: driveId } = await params;
        const body = await req.json();

        // Single update: { email, status }
        // Bulk update: { updates: [{ email, status }] }
        const updates = body.updates || [{ email: body.email, status: body.status }];

        const results = [];

        for (const update of updates) {
            if (!update.email || !update.status) continue;

            // Find user by email
            const user = await db.user.findUnique({
                where: { email: update.email },
                select: { id: true },
            });

            if (!user) {
                results.push({ email: update.email, success: false, error: "User not found" });
                continue;
            }

            // Update application status
            try {
                await db.placementApplication.update({
                    where: {
                        userId_driveId: {
                            userId: user.id,
                            driveId,
                        },
                    },
                    data: {
                        status: update.status,
                        stage: update.stage || null,
                        stageNumber: update.stageNumber || undefined,
                    },
                });
                results.push({ email: update.email, success: true });
            } catch {
                results.push({ email: update.email, success: false, error: "Application not found" });
            }
        }

        return NextResponse.json({
            results,
            updated: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
        });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
