import { deleteFromR2, deleteFilesFromR2, extractKeysFromContent } from "@/lib/s3";

// Define a type that covers the structure we expect for cleanup
// This avoids circular dependencies with Prisma types if we just need the shape
interface CleanupItem {
    type: string;
    content?: string | null;
    assignment?: {
        problems: {
            videoSolution?: string | null;
            description: string;
            hints: any; // JSON
        }[];
    } | null;
}

export async function cleanupItemResources(item: CleanupItem) {
    console.log(`Cleaning up resources for item type: ${item.type}`);
    const keysToDelete: string[] = [];

    // 1. Direct Video Content
    if (item.type === "VIDEO" && item.content) {
        // reuse existing logic for single file or just add to batch
        // item.content is usually the public URL
        const keys = extractKeysFromContent(item.content);
        keysToDelete.push(...keys);
    }

    // 2. Web Dev Content (JSON)
    if (item.type === "WEB_DEV" && item.content) {
        try {
            const content = JSON.parse(item.content);
            // Delete video solution
            if (content.videoSolution) {
                const keys = extractKeysFromContent(content.videoSolution);
                keysToDelete.push(...keys);
            }
            // Delete images in instructions
            if (content.instructions) {
                const keys = extractKeysFromContent(content.instructions);
                keysToDelete.push(...keys);
            }
        } catch (e) {
            console.error("Failed to parse WEB_DEV content for cleanup", e);
        }
    }

    // 3. AI Interview / LeetCode (JSON content)
    if ((item.type === "LEETCODE" || item.type === "AI_INTERVIEW") && item.content) {
        try {
            const content = JSON.parse(item.content);
            if (content.videoSolution) {
                const keys = extractKeysFromContent(content.videoSolution);
                keysToDelete.push(...keys);
            }
            // Check for other potential image fields or if description is stored here
        } catch (e) {
            // content might be just a string ID or URL for some legacy types, ignore
        }
    }

    // 4. Assignments & Tests (Linked Problems)
    if (item.assignment && item.assignment.problems) {
        for (const problem of item.assignment.problems) {
            // A. Video Solution
            if (problem.videoSolution) {
                const keys = extractKeysFromContent(problem.videoSolution);
                keysToDelete.push(...keys);
            }

            // B. Description Images
            if (problem.description) {
                const keys = extractKeysFromContent(problem.description);
                keysToDelete.push(...keys);
            }

            // C. Hints (Video & Images)
            if (problem.hints) {
                try {
                    const hints = Array.isArray(problem.hints)
                        ? problem.hints
                        : JSON.parse(problem.hints as unknown as string);

                    if (Array.isArray(hints)) {
                        hints.forEach((hint: any) => {
                            // Hint Video
                            if (hint.type === "video" && hint.content) {
                                const keys = extractKeysFromContent(hint.content);
                                keysToDelete.push(...keys);
                            }
                            // Hint Text Images
                            if (hint.type === "text" && hint.content) {
                                const keys = extractKeysFromContent(hint.content);
                                keysToDelete.push(...keys);
                            }
                        });
                    }
                } catch (e) {
                    console.error("Failed to parse hints for cleanup", e);
                }
            }
        }
    }

    // Perform Batch Deletion
    if (keysToDelete.length > 0) {
        await deleteFilesFromR2(keysToDelete);
    }
}
