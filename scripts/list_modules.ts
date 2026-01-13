
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("Listing All Modules...");
    const modules = await prisma.module.findMany({
        select: { id: true, title: true }
    });

    modules.forEach(m => console.log(`[${m.id}] ${m.title}`));
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
