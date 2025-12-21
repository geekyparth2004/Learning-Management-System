import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        // Only teachers can view submissions
        if (!session || !session.user || session.user.role !== "TEACHER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Get all submissions for problems in this assignment
        const assignment = await db.assignment.findUnique({
            where: { id },
            include: {
                problems: {
                    include: {
                        submissions: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                            orderBy: {
                                createdAt: "desc",
                            },
                        },
                    },
                },
            },
        });

        if (!assignment) {
            return NextResponse.json(
                { error: "Assignment not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(assignment);
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: assignmentId } = await params;
        const { code, language, passed, duration } = await request.json();

        // Get the first problem of the assignment (assuming one problem per assignment)
        const assignment = await db.assignment.findUnique({
            where: { id: assignmentId },
            include: { problems: true },
        });

        if (!assignment || assignment.problems.length === 0) {
            return NextResponse.json(
                { error: "Assignment not found" },
                { status: 404 }
            );
        }

        const problemId = assignment.problems[0].id;

        // Check if this is the first submission
        const existingSubmissionsCount = await db.submission.count({
            where: {
                userId: session.user.id,
                problemId: problemId,
            },
        });

        // Create submission
        const submission = await db.submission.create({
            data: {
                userId: session.user.id,
                problemId,
                code,
                language,
                status: passed ? "PASSED" : "FAILED", // Changed ACCEPTED -> PASSED to match dashboard filter
                duration: duration || 0
            },
        });

        // Reset the timer by deleting the progress record
        // This ensures next visit starts fresh with new startedAt
        await db.assignmentProgress.deleteMany({
            where: {
                userId: session.user.id,
                assignmentId: assignmentId,
            },
        });

        if (passed) {
            // Find the ModuleItem associated with this assignment
            const moduleItem = await db.moduleItem.findFirst({
                where: { assignmentId: assignmentId },
                include: { module: { include: { items: true } } }
            });

            if (moduleItem) {
                const userId = session.user.id;

                // 1. Mark item as completed
                const existingProgress = await db.moduleItemProgress.findUnique({
                    where: { userId_moduleItemId: { userId, moduleItemId: moduleItem.id } },
                });

                if (!existingProgress) {
                    await db.moduleItemProgress.create({
                        data: {
                            userId,
                            moduleItemId: moduleItem.id,
                            isCompleted: true,
                            completedAt: new Date(),
                        },
                    });
                } else if (!existingProgress.isCompleted) {
                    await db.moduleItemProgress.update({
                        where: { id: existingProgress.id },
                        data: { isCompleted: true, completedAt: new Date() },
                    });
                }

                // 2. Check Module Completion
                const module = moduleItem.module;
                const allItems = module.items;

                // Fetch all progress for this module
                const allProgress = await db.moduleItemProgress.findMany({
                    where: {
                        userId,
                        moduleItemId: { in: allItems.map(i => i.id) },
                    },
                });

                const allCompleted = allItems.every(i =>
                    allProgress.some(p => p.moduleItemId === i.id && p.isCompleted)
                );

                if (allCompleted) {
                    // Mark module as completed
                    await db.moduleProgress.update({
                        where: { userId_moduleId: { userId, moduleId: module.id } },
                        data: { status: "COMPLETED", completedAt: new Date() },
                    });

                    // 3. Unlock Next Module
                    const nextModule = await db.module.findFirst({
                        where: {
                            courseId: module.courseId,
                            order: { gt: module.order },
                        },
                        orderBy: { order: "asc" },
                    });

                    if (nextModule) {
                        const nextProgress = await db.moduleProgress.findUnique({
                            where: { userId_moduleId: { userId, moduleId: nextModule.id } },
                        });

                        if (!nextProgress) {
                            await db.moduleProgress.create({
                                data: {
                                    userId,
                                    moduleId: nextModule.id,
                                    status: "IN_PROGRESS",
                                },
                            });
                        }
                    } else {
                        // Course Completed?
                        await db.enrollment.update({
                            where: { userId_courseId: { userId, courseId: module.courseId } },
                            data: { status: "COMPLETED" },
                        });
                    }
                }
            }

            // Trigger notification for teacher
            const course = await db.course.findFirst({
                where: { modules: { some: { items: { some: { assignmentId: assignmentId } } } } },
                select: { teacherId: true, id: true }
            });

            if (course && course.teacherId) {
                await db.notification.create({
                    data: {
                        userId: course.teacherId,
                        title: "Assignment Submitted",
                        message: `Student submitted assignment: ${assignment.title}`,
                        type: "ASSIGNMENT_SUBMITTED",
                        link: `/teacher/courses/${course.id}/assignments/${assignmentId}/submissions`,
                    },
                });
            }
        }

        // Push to GitHub ONLY if it's the first submission
        if (existingSubmissionsCount === 0) {
            try {
                const user = await db.user.findUnique({ where: { id: session.user.id } });
                if (user?.githubAccessToken) {
                    const moduleItem = await db.moduleItem.findFirst({
                        where: { assignmentId: assignmentId },
                        include: { module: { include: { course: true } } }
                    });

                    if (moduleItem?.module?.course) {
                        const repoName = `${moduleItem.module.course.title.toLowerCase().replace(/\s+/g, "-")}-${session.user.id.slice(-4)}`;
                        const { createOrUpdateFile } = await import("@/lib/github");

                        // Determine file extension
                        const extensionMap: Record<string, string> = {
                            "javascript": "js",
                            "python": "py",
                            "java": "java",
                            "cpp": "cpp",
                            "c": "c",
                            "typescript": "ts",
                            "go": "go",
                            "rust": "rs",
                        };
                        const ext = extensionMap[language.toLowerCase()] || "txt";

                        // Use problem title for filename
                        const problem = assignment.problems[0];
                        const moduleTitle = moduleItem.module.title.replace(/\s+/g, "_");
                        const filename = `${moduleTitle}/${problem.title.replace(/\s+/g, "_")}.${ext}`;

                        await createOrUpdateFile(
                            user.githubAccessToken,
                            repoName,
                            filename,
                            code,
                            `Solved ${problem.title}`
                        );
                    }
                }
            } catch (error) {
                console.error("Error pushing to GitHub:", error);
            }
        }

        return NextResponse.json({
            success: true,
            submission,
            message: "Submission successful"
        });
    } catch (error) {
        console.error("Submission error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
