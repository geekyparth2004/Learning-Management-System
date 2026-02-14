const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearWebDevDefaults() {
    try {
        // Find all WEB_DEV problems
        const problems = await prisma.problem.findMany({
            where: {
                type: 'WEB_DEV'
            }
        });

        console.log(`Found ${problems.length} WEB_DEV problems.`);

        for (const problem of problems) {
            if (!problem.webDevInitialCode) continue;

            // Update to empty strings
            await prisma.problem.update({
                where: { id: problem.id },
                data: {
                    webDevInitialCode: {
                        html: "",
                        css: "",
                        js: ""
                    }
                }
            });
            console.log(`Cleared defaults for problem: ${problem.title} (${problem.id})`);
        }

        console.log("Finished clearing web dev defaults.");
    } catch (error) {
        console.error("Error updating problems:", error);
    } finally {
        await prisma.$disconnect();
    }
}

clearWebDevDefaults();
