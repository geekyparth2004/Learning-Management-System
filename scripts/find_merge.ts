import { db } from "@/lib/db";

async function findItem() {
    const items = await db.moduleItem.findMany({
        where: {
            OR: [
                { title: { contains: "Merge Sort" } },
                { title: { contains: "Sorted Arrays" } }
            ]
        },
        include: {
            module: true,
            assignment: {
                include: { problems: true }
            }
        }
    });

    for (const item of items) {
        console.log(JSON.stringify({
            id: item.id,
            title: item.title,
            type: item.type,
            module: item.module.title,
            hasAssignment: !!item.assignment,
            assignmentId: item.assignmentId,
            problems: item.assignment?.problems || [],
            content: item.content
        }, null, 2));
        console.log("\n---\n");
    }
}

findItem().then(() => process.exit(0)).catch(console.error);
