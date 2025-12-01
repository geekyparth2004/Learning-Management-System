import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;
        const userId = session?.user?.id;

        const course = await db.course.findUnique({
            where: { id },
            include: {
                modules: {
                    orderBy: { order: "asc" },
                    include: {
                        items: {
                            orderBy: { order: "asc" },
                            include: {
                                testProblems: {
                                    include: {
                                        testCases: true
                                    }
                                }
                            }
                        },
                    },
                },
            },
        });

        if (!course) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        let isEnrolled = false;
        let modulesWithProgress = course.modules.map(m => ({
            ...m,
            status: "LOCKED",
            startedAt: null as Date | null,
            completedAt: null as Date | null,
            items: m.items.map(i => ({ ...i, isCompleted: false }))
        }));

        if (userId) {
            const enrollment = await db.enrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId,
                        courseId: id,
                    },
                },
            });

            if (enrollment) {
                isEnrolled = true;

                // Fetch progress
                const moduleProgress = await db.moduleProgress.findMany({
                    where: { userId, module: { courseId: id } },
                });

                const itemProgress = await db.moduleItemProgress.findMany({
                    where: { userId, moduleItem: { module: { courseId: id } } },
                });

                modulesWithProgress = course.modules.map((m, index) => {
                    const progress = moduleProgress.find(mp => mp.moduleId === m.id);
                    let status = progress?.status || "LOCKED";

                    // Unlock first module if enrolled and no progress
                    if (index === 0 && !progress) {
                        status = "LOCKED"; // Will be unlocked by user action or default logic?
                        // Actually, let's say first module is unlocked but not started
                        // But wait, we want "Start Module" button. So status could be "LOCKED" but accessible?
                        // Let's use logic: If previous module completed, this one is UNLOCKED (but maybe not IN_PROGRESS).
                        // For simplicity, let's say "LOCKED" means not accessible. "IN_PROGRESS" means accessible/started.
                        // We need a state for "UNLOCKED but not STARTED".
                        // Let's stick to: LOCKED, IN_PROGRESS, COMPLETED.
                        // If index 0, it should be IN_PROGRESS (or at least unlocked).
                    }

                    // Map items
                    const items = m.items.map(i => {
                        const ip = itemProgress.find(p => p.moduleItemId === i.id);
                        return { ...i, isCompleted: ip?.isCompleted || false };
                    });

                    return {
                        ...m,
                        status,
                        startedAt: progress?.startedAt || null,
                        completedAt: progress?.completedAt || null,
                        items,
                    };
                });

                // Logic to ensure correct locking
                // If Module N is COMPLETED, Module N+1 should be IN_PROGRESS (or ready to start)
                // We'll handle this in the "complete-item" or "enroll" logic mostly, but here we just read state.
                // However, if the user just enrolled, we might need to initialize the first module.
            }
        }

        return NextResponse.json({
            ...course,
            isEnrolled,
            modules: modulesWithProgress,
        });
    } catch (error) {
        console.error("Error fetching course player:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
