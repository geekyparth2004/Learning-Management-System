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

        const problem = assignment.problems[0];
        const problemId = problem.id;

        // Check if this is the first submission
        const existingSubmissionsCount = await db.submission.count({
            where: {
                userId: session.user.id,
                problemId: problemId,
            },
        });

        // Evaluate MCQ locally and ignore client's `passed` flag
        let finalPassed = passed;
        if (problem.type === "MCQ") {
            finalPassed = (code === problem.mcqCorrectAnswer);
        }

        // Create submission and update progress in parallel
        const [submission] = await Promise.all([
            db.submission.create({
                data: {
                    userId: session.user.id,
                    problemId,
                    code,
                    language,
                    status: finalPassed ? "PASSED" : "FAILED",
                    duration: duration || 0
                },
            }),
            db.assignmentProgress.upsert({
                where: {
                    userId_assignmentId: {
                        userId: session.user.id,
                        assignmentId: assignmentId,
                    }
                },
                create: {
                    userId: session.user.id,
                    assignmentId: assignmentId,
                    startedAt: new Date()
                },
                update: {
                    startedAt: new Date()
                }
            })
        ]);

        if (finalPassed) { // Changed from `passed` to `finalPassed`
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
            await (async () => {
                try {
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
                } catch (e) { console.error("Notification Error:", e); }
            })();
        }

        // Push to GitHub ONLY if it's the first submission
        if (existingSubmissionsCount === 0) {
            await (async () => {
                try {
                    const { getGitHubAccessToken } = await import("@/lib/github");
                    const userId = session.user.id!;
                    const githubAccessToken = await getGitHubAccessToken(userId);

                    if (githubAccessToken) {
                        const moduleItem = await db.moduleItem.findFirst({
                            where: { assignmentId: assignmentId },
                            include: { module: { include: { course: true } } }
                        });

                        if (moduleItem?.module?.course) {
                            const repoName = `${moduleItem.module.course.title.toLowerCase().replace(/\s+/g, "-")}-${userId.slice(-4)}`;
                            const { createOrUpdateFile } = await import("@/lib/github");

                            const problem = assignment.problems[0];
                            const moduleTitle = moduleItem.module.title.replace(/\s+/g, "_");
                            const assignmentTitle = problem.title.replace(/\s+/g, "_");

                            if (language === "web-dev") {
                                // Handle Web Dev Submission (Multiple Files)
                                try {
                                    const files = JSON.parse(code); // Expecting array of {name, content}
                                    if (Array.isArray(files)) {
                                        for (const file of files) {
                                            const filename = `${moduleTitle}/${assignmentTitle}/${file.name}`;
                                            await createOrUpdateFile(
                                                githubAccessToken,
                                                repoName,
                                                filename,
                                                file.content,
                                                `Solved ${problem.title} - ${file.name}`
                                            );
                                        }
                                    }
                                } catch (e) {
                                    console.error("Error parsing web dev files for GitHub:", e);
                                }
                            } else {
                                // Handle Standard Coding Submission (Single File)
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

                                const filename = `${moduleTitle}/${assignmentTitle}.${ext}`;

                                await createOrUpdateFile(
                                    githubAccessToken,
                                    repoName,
                                    filename,
                                    code,
                                    `Solved ${problem.title}`
                                );
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error pushing to GitHub:", error);
                }
            })();
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
