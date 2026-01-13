
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Auditing ModuleItem videos...");
    const items = await prisma.moduleItem.findMany({
        where: { type: "VIDEO" },
        select: { id: true, title: true, content: true }
    });

    console.log(`Found ${items.length} video items.`);
    items.forEach((item: any) => {
        console.log(`[${item.id}] ${item.title}: ${item.content}`);
    });

    console.log("\nAuditing Problem video solutions...");
    const problems = await prisma.problem.findMany({
        where: { NOT: { videoSolution: null } },
        select: { id: true, title: true, videoSolution: true }
    });

    console.log(`Found ${problems.length} problems with video solutions.`);
    problems.forEach((prob: any) => {
        console.log(`[${prob.id}] ${prob.title}: ${prob.videoSolution}`);
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
