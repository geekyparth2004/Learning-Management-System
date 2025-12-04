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
            return NextResponse.json({ error: "Missing module ID" }, { status: 400 });
        }

        // Fetch module and items to delete files
        const moduleToDelete = await db.module.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        assignment: {
                            include: {
                                problems: true
                            }
                        }
                    }
                }
            }
        });

        if (moduleToDelete) {
            for (const item of moduleToDelete.items) {
                // Delete video file if it exists
                if (item.type === "VIDEO" && item.content) {
                    await deleteFromR2(item.content);
                }

                // Delete LeetCode solution video if it exists
                if (item.type === "LEETCODE" && item.assignment?.problems?.[0]?.videoSolution) {
                    await deleteFromR2(item.assignment.problems[0].videoSolution);
                }
            }
        }

        // Delete the module
        const deletedModule = await db.module.delete({
            where: {
                id: id,
            },
        });

        return NextResponse.json(deletedModule);
    } catch (error) {
        console.error("Error deleting module:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
