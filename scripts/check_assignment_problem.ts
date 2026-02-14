import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
    const problem = await db.problem.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: {
            id: true,
            title: true,
            type: true,
            defaultCode: true,
            description: true
        }
    });

    console.log(JSON.stringify(problem, null, 2));
    await db.$disconnect();
}

main();
