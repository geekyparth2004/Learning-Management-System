import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "TEACHER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const course = await db.course.findUnique({
            where: { id },
            include: {
                modules: {
                    orderBy: { order: "asc" },
                    include: {
                        items: {
                            orderBy: { order: "asc" },
                        },
                    },
                },
            },
        });

        if (!course) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        return NextResponse.json(course);
    } catch (error) {
        console.error("Error fetching course:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
