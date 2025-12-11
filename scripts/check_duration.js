const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Checking Module Item Durations...');
    const items = await prisma.moduleItem.findMany({
        take: 10,
        select: { title: true, type: true, duration: true }
    });
    console.log(JSON.stringify(items, null, 2));

    console.log('\nChecking Module Item Progress for User...');
    // We'll just grab the first progress found to show an example
    const progress = await prisma.moduleItemProgress.findMany({
        take: 5,
        where: { isCompleted: true },
        include: { moduleItem: { select: { title: true, duration: true } } }
    });
    console.log(JSON.stringify(progress, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
