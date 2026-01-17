import { db } from "@/lib/db";
import { auth } from "@/auth";
import { deleteFromR2 } from "@/lib/s3";
import { cleanupItemResources } from "@/lib/resource-cleanup";


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

        // Fetch item to get content URL and module/course info for authorization
        const item = await db.moduleItem.findUnique({
            where: { id },
            include: {
                assignment: {
                    include: {
                        problems: true
                    }
                },
                module: {
                    include: {
                        course: true
                    }
                }
            }
        });

    },
});

return NextResponse.json(deletedItem);
    } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}
}
