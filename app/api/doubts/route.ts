import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

// POST – Create a new doubt
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { content, moduleItemId, courseId } = await request.json();

        if (!content || !moduleItemId || !courseId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Create the doubt
        const doubt = await db.doubt.create({
            data: {
                content,
                studentId: session.user.id,
                moduleItemId,
                courseId,
            },
            include: {
                student: { select: { name: true, image: true } },
            },
        });

        // Find the course teacher to send notification
        const course = await db.course.findUnique({
            where: { id: courseId },
            select: { teacherId: true, title: true },
        });

        const moduleItem = await db.moduleItem.findUnique({
            where: { id: moduleItemId },
            select: { title: true },
        });

        if (course?.teacherId) {
            await db.notification.create({
                data: {
                    userId: course.teacherId,
                    title: "New Doubt Asked",
                    message: `${session.user.name || "A student"} asked a doubt on "${moduleItem?.title || "an item"}" in "${course.title}"`,
                    type: "DOUBT_ASKED",
                    link: "/teacher/doubts",
                },
            });
        }

        return NextResponse.json(doubt);
    } catch (error) {
        console.error("Error creating doubt:", error);
        return NextResponse.json({ error: "Failed to create doubt" }, { status: 500 });
    }
}

// GET – Fetch doubts
// Query params: moduleItemId (student view), courseId, teacherId, status
export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const moduleItemId = searchParams.get("moduleItemId");
        const teacherId = searchParams.get("teacherId");
        const status = searchParams.get("status");
        const countOnly = searchParams.get("countOnly");

        // Build where clause
        const where: any = {};

        if (moduleItemId) {
            where.moduleItemId = moduleItemId;
        }

        if (teacherId) {
            // Get all courses owned by this teacher
            const courses = await db.course.findMany({
                where: { teacherId },
                select: { id: true },
            });
            where.courseId = { in: courses.map(c => c.id) };
        }

        if (status) {
            where.status = status;
        }

        // If only count is needed (for badge)
        if (countOnly === "true") {
            const count = await db.doubt.count({ where });
            return NextResponse.json({ count });
        }

        const doubts = await db.doubt.findMany({
            where,
            include: {
                student: { select: { name: true, image: true } },
                moduleItem: {
                    select: {
                        title: true,
                        module: {
                            select: {
                                title: true,
                                course: { select: { title: true, id: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(doubts);
    } catch (error) {
        console.error("Error fetching doubts:", error);
        return NextResponse.json({ error: "Failed to fetch doubts" }, { status: 500 });
    }
}
