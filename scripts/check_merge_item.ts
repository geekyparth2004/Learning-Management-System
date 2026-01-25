import { db } from "@/lib/db";

async function checkMergeSortedArrays() {
    // Search for "Merge Sorted Arrays" across ALL item types
    const items = await db.moduleItem.findMany({
        where: {
            title: {
                contains: "Merge"
            }
        },
        include: {
            module: {
                select: {
                    title: true,
                    order: true
                }
            },
            assignment: {
                include: {
                    problems: true
                }
            }
        }
    });

    console.log(`\nFound ${items.length} items with "Merge" in title:\n`);

    for (const item of items) {
        console.log(`\n${"=".repeat(60)}`);
        console.log(`Title: ${item.title}`);
        console.log(`Module: ${item.module.title}`);
        console.log(`Type: ${item.type}`);
        console.log(`Content: ${item.content}`);
        console.log(`AssignmentId: ${item.assignmentId || 'NULL'}`);

        if (item.assignment) {
            console.log(`\nAssignment Details:`);
            console.log(`  - Has ${item.assignment.problems.length} problems`);
            item.assignment.problems.forEach((prob, idx) => {
                console.log(`\n  Problem #${idx + 1}:`);
                console.log(`    LeetCode URL: ${prob.leetcodeUrl}`);
                console.log(`    Slug: ${prob.slug}`);
                console.log(`    Video Solution: ${prob.videoSolution || 'NOT SET ⚠️'}`);
            });
        }

        if (item.type === "LEETCODE" && item.content) {
            try {
                const contentData = JSON.parse(item.content);
                console.log(`\nParsed Content:`);
                console.log(`  - LeetCode URL: ${contentData.leetcodeUrl}`);
                console.log(`  - Video Solution: ${contentData.videoSolution || 'NOT SET ⚠️'}`);
            } catch (e) {
                console.log(`  ⚠️ Failed to parse content JSON`);
            }
        }
    }

    console.log(`\n${"=".repeat(60)}\n`);
}

checkMergeSortedArrays()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });
