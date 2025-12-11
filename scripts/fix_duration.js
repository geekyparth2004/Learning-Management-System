const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Updating Bubble Sort Duration...');
    await prisma.moduleItem.updateMany({
        where: { title: "Bubble Sort" },
        data: { duration: 3600 } // 1 Hour
    });
    console.log('Updated Duration to 3600s.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
