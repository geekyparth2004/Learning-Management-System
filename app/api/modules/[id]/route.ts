import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { deleteFromR2 } from "@/lib/s3";
import { cleanupItemResources } from "@/lib/resource-cleanup";
import { cacheDelete, CACHE_KEYS } from "@/lib/redis";


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

        // Fetch module with items to delete files
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
            const courseId = moduleToDelete.courseId;
            for (const item of moduleToDelete.items) {
                await cleanupItemResources(item);
            }
            await db.module.delete({
                where: { id },
            });
            // Invalidate course cache
            await cacheDelete(CACHE_KEYS.course(courseId));
        }

        return NextResponse.json({ message: "Module deleted" });
    } catch (error) {
        console.error("Error deleting module:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
