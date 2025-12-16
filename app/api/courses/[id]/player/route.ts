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
                                },
                                assignment: {
                                    include: {
                                        problems: {
                                            include: {
                                                testCases: true
                                            }
                                        }
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

                modulesWithProgress = await Promise.all(course.modules.map(async (m, index) => {
                    const progress = moduleProgress.find(mp => mp.moduleId === m.id);
                    let status = progress?.status || "LOCKED";

                    // Unlock first module if enrolled and no progress
                    if (index === 0 && !progress) {
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

                    // Map items
                    const items = await Promise.all(m.items.map(async i => {
                        const ip = itemProgress.find(p => p.moduleItemId === i.id);
                        let signedUrl = null;
                        if (i.content && (i.content.includes("r2.cloudflarestorage.com") || i.content.includes("backblazeb2.com"))) {
                            signedUrl = await signR2Url(i.content);
                        }

                        // Process testProblems hints if they exist
                        const processedTestProblems = i.testProblems ? await Promise.all(i.testProblems.map(async (p: any) => {
                            const hintsRaw = typeof p.hints === 'string' ? JSON.parse(p.hints) : (p.hints || []);
                            const processedHints = await Promise.all(hintsRaw.map(async (hintItem: any, index: number) => {
                                let type = "text";
                                let content = "";
                                if (typeof hintItem === 'string') {
                                    content = hintItem;
                                } else {
                                    type = hintItem.type || "text";
                                    content = hintItem.content || "";
                                }

                                if (type === "video" && (content.includes("r2.cloudflarestorage.com") || content.includes("backblazeb2.com"))) {
                                    content = await signR2Url(content);
                                }
                                return {
                                    type,
                                    content,
                                    locked: true,
                                    unlockTime: new Date(Date.now() + (index + 1) * 300000).toISOString()
                                };
                            }));

                            // Append video solution
                            if (p.videoSolution) {
                                let content = p.videoSolution;
                                if (content.includes("r2.cloudflarestorage.com") || content.includes("backblazeb2.com")) {
                                    content = await signR2Url(content);
                                }
                                processedHints.push({
                                    type: "video",
                                    content,
                                    locked: true,
                                    unlockTime: new Date(Date.now() + (processedHints.length + 1) * 300000).toISOString()
                                });
                            }

                            return { ...p, hints: processedHints };
                        })) : [];

                        // Also sign assignment video solution if exists (e.g. LeetCode)
                        let signedVideoSolution = null;
                        const videoSol = i.assignment?.problems?.[0]?.videoSolution;
                        if (videoSol && (videoSol.includes("r2.cloudflarestorage.com") || videoSol.includes("backblazeb2.com"))) {
                            signedVideoSolution = await signR2Url(videoSol);
                        }

                        return {
                            ...i,
                            isCompleted: ip?.isCompleted || false,

                            startedAt: ip?.startedAt || null,
                            signedUrl,
                            signedVideoSolution,
                            testProblems: processedTestProblems.length > 0 ? processedTestProblems : i.testProblems
                        };
                    }));

                    return {
                        ...m,
                        status,
                        startedAt: progress?.startedAt || null,
                        completedAt: progress?.completedAt || null,
                        items,
                    };
                }));

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
