import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
    // ID from previous step: cmllztno90011...
    // Let's find the problem by title or ID and update it.

    // We'll update the latest problem to be WEB_DEV for testing
    // Using explicit string cast if needed, though Prisma strings should be fine.
    const problem = await db.problem.findFirst({
        orderBy: { updatedAt: 'desc' },
    });

    if (!problem) return;

    console.log(`Updating problem ${problem.id} (${problem.title}) to WEB_DEV`);

    await db.problem.update({
        where: { id: problem.id },
        data: {
            type: "WEB_DEV",
            // Add some default web dev code if missing
            defaultCode: JSON.stringify({
                html: "<h1>Hello World</h1>",
                css: "body { color: red; }",
                js: "console.log('Hello');"
            })
        }
    });

    console.log("Update complete");
    await db.$disconnect();
}

main();
