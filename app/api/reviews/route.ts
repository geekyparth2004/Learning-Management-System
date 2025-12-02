import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "TEACHER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id, action } = await req.json(); // action: "APPROVED" | "REJECTED"

        if (!id || !["APPROVED", "REJECTED"].includes(action)) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        const updateData: any = {
            reviewStatus: action,
        };

        if (action === "APPROVED") {
            updateData.isCompleted = true;
            updateData.completedAt = new Date();
        } else {
            updateData.isCompleted = false;
        }

        await db.moduleItemProgress.update({
            where: { id },
            data: updateData,
        });

        // Trigger notification for student (Optional enhancement)
        const progress = await db.moduleItemProgress.findUnique({
            where: { id },
            include: { moduleItem: true }
        });

        if (progress) {
            // Logic to notify student could go here
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating review:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
