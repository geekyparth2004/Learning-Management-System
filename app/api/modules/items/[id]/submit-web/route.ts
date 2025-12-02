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
        const { html, css, js } = await req.json();

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
            },
            create: {
                userId: session.user.id,
                moduleItemId: id,
                isCompleted: true,
                completedAt: new Date(),
                webDevSubmission: JSON.stringify({ html, css, js }),
            },
        });

        // Create/Update File in GitHub
        try {
            const user = await db.user.findUnique({ where: { id: session.user.id } });
            if (user?.githubAccessToken) {
                // Find course title to construct repo name
                const moduleItem = await db.moduleItem.findUnique({
                    where: { id },
                    include: { module: { include: { course: true } } },
                });

                if (moduleItem?.module?.course) {
                    const repoName = `${moduleItem.module.course.title.toLowerCase().replace(/\s+/g, "-")}-${session.user.id.slice(-4)}`;
                    const { createOrUpdateFile } = await import("@/lib/github");

                    const moduleTitle = moduleItem.module.title.replace(/\s+/g, "-");
                    const itemTitle = moduleItem.title.replace(/\s+/g, "-");

                    // Create HTML file
                    await createOrUpdateFile(
                        user.githubAccessToken,
                        repoName,
                        `${moduleTitle}/${itemTitle}/index.html`,
                        html,
                        `Update ${moduleItem.title} - HTML`
                    );

                    // Create CSS file
                    await createOrUpdateFile(
                        user.githubAccessToken,
                        repoName,
                        `${moduleTitle}/${itemTitle}/styles.css`,
                        css,
                        `Update ${moduleItem.title} - CSS`
                    );

                    // Create JS file
                    await createOrUpdateFile(
                        user.githubAccessToken,
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

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error submitting web dev assignment:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
