import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signR2Url } from "@/lib/s3";
import { auth } from "@/auth";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const problem = await db.problem.findUnique({
            where: { id },
            include: {
                testCases: true // Include test cases for the player
            }
        });

        if (!problem) {
            return NextResponse.json({ error: "Problem not found" }, { status: 404 });
        }

        // Must ensure hidden test cases are not revealed if we care about cheating,
        // but existing TestPlayer runs tests server-side?
        // Wait, TestPlayer.tsx uses /api/compile which runs code.
        // It also receives `problems` prop with testCases.
        // In TestPlayer, testCases are displayed in the UI:
        // {activeProblem.testCases.map((tc, idx) => (... Input: {tc.input} ... Expected: {tc.expectedOutput} ...))}
        // So for practice/assignments, test cases ARE exposed to the client in this platform's design.
        // So sending them is fine.

        // Transform hints
        const hitsRaw = typeof problem.hints === 'string' ? JSON.parse(problem.hints) : (problem.hints || []);
        const processedHints = await Promise.all(hitsRaw.map(async (hintItem: any, index: number) => {
            // Unlock schedule: 5, 10, 15... minutes. But for practice, we usually start from "now" on frontend.
            // Backend provides absolute "unlockTime" relative to a theoretical start?
            // Actually, PracticePage calculates relative to load time.
            // But we still need to structure them correctly.

            // UNLIKE assignments, practice doesn't have a fixed "startedAt" in DB usually (unless tracked).
            // So we return the structure, and let logic handle relative timing?
            // But valid `unlockTime` string is needed for interface.

            // Let's provide a "relative index" or placeholder unlockTime.
            // Actually, consistency: Assignments send absolute ISO string.
            // Practice page overwrites it based on client load time anyway.
            // But we MUST process the video URL signing here.

            let type = "text";
            let content = "";

            if (typeof hintItem === 'string') {
                content = hintItem;
            } else {
                type = hintItem.type || "text";
                content = hintItem.content || hintItem.text || hintItem.body || hintItem.description || "";
            }

            // Sign URL if video
            if (type === "video" && (content.includes("r2.cloudflarestorage.com") || content.includes("backblazeb2.com"))) {
                content = await signR2Url(content);
            }

            return {
                type,
                content,
                locked: true, // Default
                unlockTime: new Date(Date.now() + (index + 1) * 300000).toISOString(), // Placeholder
            };
        }));

        // Append video solution if exists
        if (problem.videoSolution) {
            let content = problem.videoSolution;
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

        return NextResponse.json({ ...problem, hints: processedHints });
    } catch (error) {
        console.error("Error fetching practice problem:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
