
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { createOrUpdateFile, getNextFolderSequence } from "@/lib/github";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { files, courseId, moduleTitle, videoOrder, videoTitle } = await req.json();

        // 1. Get User with GitHub Token (Robust)
        const { getGitHubAccessToken } = await import("@/lib/github");
        const githubAccessToken = await getGitHubAccessToken(session.user.id);

        if (!githubAccessToken) {
            return NextResponse.json({ error: "GitHub not connected" }, { status: 400 });
        }

        const user = { id: session.user.id }; // Minimal user obj for ID usage below

        // 2. Get Course to determine Repo Name
        const course = await db.course.findUnique({ where: { id: courseId } });
        if (!course) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        const repoName = `${course.title.toLowerCase().replace(/\s+/g, "-")}-${user.id.slice(-4)}`;

        // 3. Sync Files
        // Folder Structure: Module Name / Video Name / Practice - N / file_name

        // Use sanitize for module title
        const sanitizedModuleTitle = moduleTitle.trim();
        // Use videoTitle directly as request
        const sanitizedVideoTitle = videoTitle.trim().replace(/\//g, "-");

        const parentPath = `${sanitizedModuleTitle}/${sanitizedVideoTitle}`;



        // Calculate next sequence number ONCE for the batch
        const nextSeq = await getNextFolderSequence(
            githubAccessToken,
            repoName,
            parentPath,
            "Practice"
        );

        const folderName = `Practice - ${nextSeq}`;
        const finalPath = `${parentPath}/${folderName}`;

        const results = await Promise.all(files.map(async (file: { name: string, content: string }) => {
            return createOrUpdateFile(
                githubAccessToken,
                repoName,
                `${finalPath}/${file.name}`,
                file.content,
                `Add ${file.name} to ${folderName}`
            );
        }));

        const failures = results.filter(r => !r.success);
        if (failures.length > 0) {
            return NextResponse.json({ error: "Some files failed to sync", details: failures }, { status: 500 });
        }

        return NextResponse.json({ success: true, repoName });

    } catch (error) {
        console.error("Error syncing to GitHub:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
