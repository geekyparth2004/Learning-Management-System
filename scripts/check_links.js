const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Checking Job Links...');
    const jobs = await prisma.job.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { title: true, link: true, platform: true }
    });
    console.log(JSON.stringify(jobs, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
