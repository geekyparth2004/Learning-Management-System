import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { deleteFromR2 } from "@/lib/s3";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "TEACHER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "Missing item ID" }, { status: 400 });
        }

        // Fetch item to get content URL
        const item = await db.moduleItem.findUnique({
            where: { id },
            include: {
                assignment: {
                    include: {
                        problems: true
                    }
                }
            }
        });

        if (item) {
            // Delete video file if it exists
            if (item.type === "VIDEO" && item.content) {
                await deleteFromR2(item.content);
            }

            // Delete LeetCode solution video if it exists
            if (item.type === "LEETCODE" && item.assignment?.problems?.[0]?.videoSolution) {
                await deleteFromR2(item.assignment.problems[0].videoSolution);
            }

            // Cleanup Assignment if it exists
            if (item.assignmentId) {
                // Delete the assignment record (Cascade will handle problems/test cases)
                await db.assignment.delete({
                    where: { id: item.assignmentId }
                });
            }
        }

        // Delete the item
        const deletedItem = await db.moduleItem.delete({
            where: {
                id: id,
            },
        });

        return NextResponse.json(deletedItem);
    } catch (error) {
        console.error("Error deleting item:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
