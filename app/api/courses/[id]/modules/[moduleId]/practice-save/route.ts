import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: courseId, moduleId } = await params;
        const { code, language, videoTitle } = await req.json();

        // Push to GitHub
        try {
            const user = await db.user.findUnique({ where: { id: session.user.id } });
            if (user?.githubAccessToken) {
                const course = await db.course.findUnique({ where: { id: courseId } });
                const module = await db.module.findUnique({ where: { id: moduleId } });

                if (course && module) {
                    // New Repo Name: coding-practice (or coding-practice-<userId> if we want uniqueness, but user asked for "coding-practice")
                    // Ideally we should namespace it to avoid conflicts if multiple users use the same machine? No, auth is per user.
                    // If the user has a repo "coding-practice", we use it. 
                    // Let's stick to "coding-practice" as requested.
                    const repoName = "coding-practice";
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

                    // Generate filename: Question_Name.ext
                    // Replace spaces with underscores
                    const fileBaseName = (videoTitle ? videoTitle : module.title).trim().replace(/\s+/g, "_");

                    // Path: fileBaseName.ext (In root of repo? Or in a src folder?)
                    // User didn't specify folder, but root is cleaner for "coding-practice".
                    // Or maybe we can group by topic? 
                    // Let's just put it in root for now as per "according the name of the question".
                    const filename = `${fileBaseName}.${ext}`;

                    await createOrUpdateFile(
                        user.githubAccessToken,
                        repoName,
                        filename,
                        code,
                        `Practice code for ${videoTitle || module.title}`
                    );

                    return NextResponse.json({ success: true, message: "Saved to GitHub" });
                }
            }
            return NextResponse.json({ error: "GitHub not connected or Course/Module not found" }, { status: 400 });
        } catch (error) {
            console.error("Error pushing to GitHub:", error);
            return NextResponse.json({ error: "Failed to push to GitHub" }, { status: 500 });
        }
    } catch (error) {
        console.error("Error saving practice code:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
