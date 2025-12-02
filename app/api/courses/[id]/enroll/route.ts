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

        // Check if already enrolled
        const existing = await db.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId: id } },
        });

        if (existing) {
            return NextResponse.json({ message: "Already enrolled" });
        }

        // Enroll
        await db.enrollment.create({
            data: {
                userId,
                courseId: id,
            },
        });

        // Initialize first module
        const firstModule = await db.module.findFirst({
            where: { courseId: id },
            orderBy: { order: "asc" },
        });

        if (firstModule) {
            await db.moduleProgress.create({
                data: {
                    userId,
                    moduleId: firstModule.id,
                    status: "IN_PROGRESS", // Unlocked but not started (startedAt is null by default)
                },
            });
        }

        // Create GitHub Repository
        try {
            const user = await db.user.findUnique({ where: { id: userId } });
            if (user?.githubAccessToken) {
                const course = await db.course.findUnique({ where: { id } });
                if (course) {
                    const repoName = `${course.title.toLowerCase().replace(/\s+/g, "-")}-${userId.slice(-4)}`;
                    const { createRepository } = await import("@/lib/github");
                    await createRepository(user.githubAccessToken, repoName);
                }
            }
        } catch (error) {
            console.error("Error creating GitHub repo:", error);
            // Don't fail enrollment if GitHub fails
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error enrolling:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
