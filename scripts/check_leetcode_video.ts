import { db } from "@/lib/db";

async function checkLeetCodeVideo() {
    // Find all LEETCODE type items
    const leetcodeItems = await db.moduleItem.findMany({
        where: {
            type: "LEETCODE"
        },
        include: {
            module: {
                select: {
                    title: true,
                    order: true
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        },
        take: 10
    });

    console.log("\n=== LEETCODE Items ===\n");

    for (const item of leetcodeItems) {
        console.log(`Module: ${item.module.title}`);
        console.log(`Item: ${item.title}`);
        console.log(`Type: ${item.type}`);
        console.log(`Content:`, item.content);

        // Try to parse content
        if (item.content) {
            try {
                const contentData = JSON.parse(item.content);
                console.log(`  - LeetCode URL: ${contentData.leetcodeUrl || 'NOT SET'}`);
                console.log(`  - Video Solution: ${contentData.videoSolution || 'NOT SET'}`);

                if (!contentData.videoSolution) {
                    console.log(`  ⚠️ WARNING: No video solution uploaded!`);
                }
            } catch (e) {
                console.log(`  ⚠️ ERROR: Failed to parse content JSON`);
            }
        } else {
            console.log(`  ⚠️ WARNING: Content is null/empty`);
        }
        console.log("\n" + "=".repeat(60) + "\n");
    }

    // Check if "Merge Sorted Arrays" specifically has a video
    const mergeSortedArrays = await db.moduleItem.findFirst({
        where: {
            title: {
                contains: "Merge Sorted Arrays"
            },
            type: "LEETCODE"
        },
        include: {
            module: true
        }
    });

    if (mergeSortedArrays) {
        console.log("\n=== SPECIFIC ITEM: Merge Sorted Arrays ===\n");
        console.log(`ID: ${mergeSortedArrays.id}`);
        console.log(`Content:`, mergeSortedArrays.content);

        if (mergeSortedArrays.content) {
            try {
                const data = JSON.parse(mergeSortedArrays.content);
                console.log(`Has videoSolution: ${!!data.videoSolution}`);
                if (data.videoSolution) {
                    console.log(`Video URL: ${data.videoSolution}`);
                } else {
                    console.log(`⚠️ THIS PROBLEM HAS NO VIDEO SOLUTION UPLOADED!`);
                }
            } catch {
                console.log(`⚠️ Invalid JSON in content field`);
            }
        }
    } else {
        console.log("\n⚠️ Could not find 'Merge Sorted Arrays' item");
    }
}

checkLeetCodeVideo()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });
