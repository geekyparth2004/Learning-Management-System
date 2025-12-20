
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncTestStats() {
    console.log("Starting Test Stats Sync...");

    try {
        // 1. Find all "TEST" type module items that have problems
        // Actually, we can just find items with problems
        const testItems = await prisma.moduleItem.findMany({
            where: {
                testProblems: { some: {} } // Has problems related to it
            },
            include: {
                testProblems: true
            }
        });

        console.log(`Found ${testItems.length} test items.`);

        for (const item of testItems) {
            console.log(`Processing Test Item: ${item.title} (${item.id})`);

            // 2. Find users who completed this item
            const progressRecords = await prisma.moduleItemProgress.findMany({
                where: {
                    moduleItemId: item.id,
                    isCompleted: true
                }
            });

            console.log(`  - Found ${progressRecords.length} completed users.`);

            for (const progress of progressRecords) {
                const userId = progress.userId;
                let addedCount = 0;

                // 3. For each problem in the test, check/create submission
                for (const problem of item.testProblems) {
                    const existing = await prisma.submission.findFirst({
                        where: {
                            userId,
                            problemId: problem.id,
                            status: "PASSED"
                        }
                    });

                    if (!existing) {
                        await prisma.submission.create({
                            data: {
                                userId,
                                problemId: problem.id,
                                code: problem.defaultCode || "// Backfilled from Test Completion",
                                language: "java",
                                status: "PASSED",
                                duration: 0,
                                createdAt: progress.completedAt || new Date() // Use completion time if available
                            }
                        });
                        addedCount++;
                    }
                }
                if (addedCount > 0) {
                    console.log(`    - User ${userId}: Added ${addedCount} missing submissions.`);
                }
            }
        }

        console.log("Sync Complete!");
    } catch (e) {
        console.error("Sync Failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

syncTestStats();
