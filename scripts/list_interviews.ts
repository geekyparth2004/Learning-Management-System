
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("Listing all AI Interview items...");

    // Find all items that look like an interview
    const items = await prisma.moduleItem.findMany({
        where: {
            OR: [
                { type: "AI_INTERVIEW" },
                { title: { contains: "Interview", mode: 'insensitive' } }
            ]
        },
        include: {
            module: true
        }
    });

    items.forEach(item => {
        console.log(`[${item.id}] "${item.title}" in Module: "${item.module.title}"`);
        console.log(`    Current Topic: ${item.aiInterviewTopic}`);
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

export { };
