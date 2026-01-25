import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string; studentId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: courseId, studentId } = await params;

        // Verify teacher owns this course
        const course = await db.course.findUnique({
            where: { id: courseId },
            select: { teacherId: true }
        });

        if (!course || course.teacherId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Get student info and enrollment
        const enrollment = await db.enrollment.findFirst({
            where: {
                courseId,
                userId: studentId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    }
                }
            }
        });

        if (!enrollment) {
            return NextResponse.json(
                { error: "Student not enrolled in this course" },
                { status: 404 }
            );
        }

        // Get all modules with items and progress
        const modules = await db.module.findMany({
            where: { courseId },
            include: {
                items: {
                    orderBy: { order: "asc" }
                }
            },
            orderBy: { order: "asc" }
        });

        // Get all progress data for this student
        const moduleProgress = await db.moduleProgress.findMany({
            where: {
                userId: studentId,
                moduleId: { in: modules.map(m => m.id) }
            }
        });

        const itemProgress = await db.moduleItemProgress.findMany({
            where: {
                userId: studentId,
                moduleItemId: { in: modules.flatMap(m => m.items.map(i => i.id)) }
            }
        });

        // Build response with progress data
        const modulesWithProgress = modules.map(module => {
            const progress = moduleProgress.find(mp => mp.moduleId === module.id);

            const itemsWithProgress = module.items.map(item => {
                const itemProg = itemProgress.find(ip => ip.moduleItemId === item.id);

                return {
                    id: item.id,
                    title: item.title,
                    type: item.type,
                    order: item.order,
                    isCompleted: itemProg?.isCompleted || false,
                    duration: itemProg?.duration || 0,
                    reviewStatus: itemProg?.reviewStatus || null,
                    startedAt: itemProg?.startedAt || null,
                    completedAt: itemProg?.completedAt || null,
                };
            });

            return {
                id: module.id,
                title: module.title,
                order: module.order,
                timeLimit: module.timeLimit,
                status: progress?.status || "LOCKED",
                startedAt: progress?.startedAt || null,
                completedAt: progress?.completedAt || null,
                items: itemsWithProgress,
            };
        });

        return NextResponse.json({
            student: {
                id: enrollment.user.id,
                name: enrollment.user.name,
                email: enrollment.user.email,
                image: enrollment.user.image,
                enrolledAt: enrollment.enrolledAt,
            },
            modules: modulesWithProgress,
        });
    } catch (error) {
        console.error("Error fetching student progress:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
