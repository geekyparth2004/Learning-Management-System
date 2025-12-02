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
        const { code, language } = await req.json();

        // Push to GitHub
        try {
            const user = await db.user.findUnique({ where: { id: session.user.id } });
            if (user?.githubAccessToken) {
                const course = await db.course.findUnique({ where: { id: courseId } });
                const module = await db.module.findUnique({ where: { id: moduleId } });

                if (course && module) {
                    const repoName = `${course.title.toLowerCase().replace(/\s+/g, "-")}-${session.user.id.slice(-4)}`;
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

                    // Generate filename: ModuleTitle/practice-{timestamp}.ext
                    const timestamp = Date.now();
                    const filename = `${module.title.replace(/\s+/g, "-")}/practice-${timestamp}.${ext}`;

                    await createOrUpdateFile(
                        user.githubAccessToken,
                        repoName,
                        filename,
                        code,
                        `Practice code from ${module.title}`
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
