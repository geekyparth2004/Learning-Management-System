const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Clearing Job Table (Attempt 2)...');
    try {
        await prisma.job.deleteMany({});
        console.log('Successfully cleared all jobs.');
    } catch (e) {
        console.error('Error clearing jobs:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
