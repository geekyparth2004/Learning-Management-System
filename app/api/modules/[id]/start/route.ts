import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const userId = session.user.id;

        let progress = await db.moduleProgress.findUnique({
            where: { userId_moduleId: { userId, moduleId: id } },
        });

        if (!progress) {
            // Check if user is enrolled and if module should be unlocked
            const module = await db.module.findUnique({
                where: { id },
                include: { course: { include: { modules: { orderBy: { order: "asc" } } } } }
            });

            if (!module) return NextResponse.json({ error: "Module not found" }, { status: 404 });

            const enrollment = await db.enrollment.findUnique({
                where: { userId_courseId: { userId, courseId: module.courseId } }
            });

            if (!enrollment) return NextResponse.json({ error: "Not enrolled" }, { status: 403 });

            const moduleIndex = module.course.modules.findIndex(m => m.id === id);
            let isUnlocked = false;

            if (moduleIndex === 0) {
                isUnlocked = true;
            } else if (moduleIndex > 0) {
                const prevModule = module.course.modules[moduleIndex - 1];
                const prevProgress = await db.moduleProgress.findUnique({
                    where: { userId_moduleId: { userId, moduleId: prevModule.id } }
                });
                if (prevProgress?.status === "COMPLETED") {
                    isUnlocked = true;
                }
            }

            if (!isUnlocked) {
                return NextResponse.json({ error: "Module locked" }, { status: 403 });
            }

            // Create progress
            progress = await db.moduleProgress.create({
                data: {
                    userId,
                    moduleId: id,
                    status: "IN_PROGRESS",
                    startedAt: new Date(),
                },
            });
            return NextResponse.json({ success: true, message: "Started" });
        }

        if (progress.startedAt) {
            return NextResponse.json({ message: "Already started" });
        }

        await db.moduleProgress.update({
            where: { id: progress.id },
            data: { startedAt: new Date(), status: "IN_PROGRESS" }, // Ensure status is updated
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error starting module:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
