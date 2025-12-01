import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "TEACHER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { title, description } = await req.json();

        if (!title || !description) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const course = await db.course.create({
            data: {
                title,
                description,
                teacherId: session.user.id,
            },
        });

        return NextResponse.json(course);
    } catch (error) {
        console.error("Error creating course:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const courses = await db.course.findMany({
            include: {
                teacher: {
                    select: { name: true },
                },
                _count: {
                    select: { modules: true, enrollments: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(courses);
    } catch (error) {
        console.error("Error fetching courses:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
