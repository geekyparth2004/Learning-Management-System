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
        const { html, css, js, duration } = await req.json();

        // Check if this is the first submission (by checking if we already had a submission)
        const existingProgress = await db.moduleItemProgress.findUnique({
            where: {
                userId_moduleItemId: {
                    userId: session.user.id,
                    moduleItemId: id,
                },
            },
        });

        const isFirstSubmission = !existingProgress || !existingProgress.webDevSubmission;

        // Update ModuleItemProgress
        await db.moduleItemProgress.upsert({
            where: {
                userId_moduleItemId: {
                    userId: session.user.id,
                    moduleItemId: id,
                },
            },
            update: {
                isCompleted: true,
                completedAt: new Date(),
                webDevSubmission: JSON.stringify({ html, css, js }),
                duration: duration ? { increment: Number(duration) } : undefined,
            },
            create: {
                userId: session.user.id,
                moduleItemId: id,
                isCompleted: true,
                completedAt: new Date(),
                webDevSubmission: JSON.stringify({ html, css, js }),
                duration: duration ? Number(duration) : 0,
            },
        });

        // Create/Update File in GitHub ONLY if it's the first submission
        if (isFirstSubmission) {
            void (async () => {
                try {
                    const { getGitHubAccessToken } = await import("@/lib/github");
                    const userId = session.user.id!;
                    const githubAccessToken = await getGitHubAccessToken(userId);

                    if (githubAccessToken) {
                        // Find course title to construct repo name
                        const moduleItem = await db.moduleItem.findUnique({
                            where: { id },
                            include: { module: { include: { course: true } } },
                        });

                        if (moduleItem?.module?.course) {
                            const repoName = `${moduleItem.module.course.title.toLowerCase().replace(/\s+/g, "-")}-${userId.slice(-4)}`;
                            const { createOrUpdateFile } = await import("@/lib/github");

                            // Include module order number in folder name for better sorting
                            const moduleOrder = moduleItem.module.order ?? 0;
                            const moduleTitle = `${moduleOrder + 1} ${moduleItem.module.title.replace(/\s+/g, " ")}`;
                            const itemTitle = moduleItem.title.replace(/\s+/g, "-");

                            // Create HTML file
                            await createOrUpdateFile(
                                githubAccessToken,
                                repoName,
                                `${moduleTitle}/${itemTitle}/index.html`,
                                html,
                                `Update ${moduleItem.title} - HTML`
                            );

                            // Create CSS file
                            await createOrUpdateFile(
                                githubAccessToken,
                                repoName,
                                `${moduleTitle}/${itemTitle}/styles.css`,
                                css,
                                `Update ${moduleItem.title} - CSS`
                            );

                            // Create JS file
                            await createOrUpdateFile(
                                githubAccessToken,
                                repoName,
                                `${moduleTitle}/${itemTitle}/script.js`,
                                js,
                                `Update ${moduleItem.title} - JS`
                            );
                        }
                    }
                } catch (error) {
                    console.error("Error pushing to GitHub:", error);
                }
            })();
        }

        // Update streak on any successful submission
        const { updateUserStreak } = await import("@/lib/streak");
        await updateUserStreak(session.user.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error submitting web dev assignment:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
