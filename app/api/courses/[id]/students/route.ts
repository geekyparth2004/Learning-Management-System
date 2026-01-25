import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: courseId } = await params;

        // Verify teacher owns this course
        const course = await db.course.findUnique({
            where: { id: courseId },
            select: { teacherId: true, modules: { select: { id: true } } }
        });

        if (!course || course.teacherId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Get all enrollments for this course
        const enrollments = await db.enrollment.findMany({
            where: { courseId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    }
                }
            },
            orderBy: { enrolledAt: "desc" }
        });

        const totalModules = course.modules.length;

        // Calculate progress for each student
        const studentsWithProgress = await Promise.all(
            enrollments.map(async (enrollment) => {
                const moduleProgress = await db.moduleProgress.findMany({
                    where: {
                        userId: enrollment.userId,
                        moduleId: { in: course.modules.map(m => m.id) }
                    },
                    select: { status: true }
                });

                const completedModules = moduleProgress.filter(
                    mp => mp.status === "COMPLETED"
                ).length;

                const progressPercentage = totalModules > 0
                    ? Math.round((completedModules / totalModules) * 100)
                    : 0;

                return {
                    id: enrollment.user.id,
                    name: enrollment.user.name,
                    email: enrollment.user.email,
                    image: enrollment.user.image,
                    enrolledAt: enrollment.enrolledAt,
                    progressPercentage,
                    completedModules,
                    totalModules,
                };
            })
        );

        return NextResponse.json({ students: studentsWithProgress });
    } catch (error) {
        console.error("Error fetching students:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
