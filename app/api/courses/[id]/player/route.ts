import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { signR2Url } from "@/lib/s3";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;
        const userId = session?.user?.id;

        // Parallelize all queries for maximum performance
        const [course, enrollment, moduleProgress, itemProgress] = await Promise.all([
            // Fetch course with lightweight structure (no deep nesting)
            db.course.findUnique({
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
                                    },
                                    assignment: {
                                        select: {
                                            id: true,
                                            problems: {
                                                select: {
                                                    leetcodeUrl: true,
                                                    slug: true,
                                                    videoSolution: true
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }),
            // Fetch enrollment if user is logged in
            userId ? db.enrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId,
                        courseId: id,
                    },
                },
            }) : Promise.resolve(null),
            // Fetch module progress if user is logged in
            userId ? db.moduleProgress.findMany({
                where: { userId, module: { courseId: id } },
            }) : Promise.resolve([]),
            // Fetch item progress if user is logged in
            userId ? db.moduleItemProgress.findMany({
                where: { userId, moduleItem: { module: { courseId: id } } },
            }) : Promise.resolve([])
        ]);

        if (!course) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        const isEnrolled = !!enrollment;

        // Process modules with progress (no async operations inside map)
        const modulesWithProgress = course.modules.map((m, index) => {
            const progress = moduleProgress.find(mp => mp.moduleId === m.id);
            let status = progress?.status || "LOCKED";

            // Unlock first module if enrolled and no progress
            if (isEnrolled && index === 0 && !progress) {
                status = "IN_PROGRESS";
            }

            // Check validation: If previous module is completed, this one should be unlocked
            if (index > 0) {
                const prevModuleId = course.modules[index - 1].id;
                const prevProgress = moduleProgress.find(mp => mp.moduleId === prevModuleId);
                if (prevProgress?.status === "COMPLETED" && status === "LOCKED") {
                    status = "IN_PROGRESS";
                }
            }

            // RESTRICTION: Unlock Module 7 (index 6) for specific email regardless of progress
            if (index === 6 && session?.user?.email === "aids22013@gmail.com" && status === "LOCKED") {
                status = "IN_PROGRESS";
            }

            // Map items (synchronously - no database calls)
            const items = m.items.map(i => {
                const ip = itemProgress.find(p => p.moduleItemId === i.id);

                return {
                    id: i.id,
                    title: i.title,
                    type: i.type,
                    content: i.content,
                    order: i.order,
                    duration: i.duration,
                    assignmentId: i.assignmentId,
                    // Include test problems and assignments for frontend compatibility
                    testProblems: i.testProblems,
                    assignment: i.assignment,
                    // Progress fields
                    isCompleted: ip?.isCompleted || false,
                    reviewStatus: ip?.reviewStatus || null,
                    startedAt: ip?.startedAt || null,
                };
            });

            return {
                id: m.id,
                title: m.title,
                // description: m.description, // Removed: Field does not exist in Module model
                order: m.order,
                status,
                startedAt: progress?.startedAt || null,
                completedAt: progress?.completedAt || null,
                items,
            };
        });

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
