const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const usersCompletedMod6 = await prisma.user.findMany({
        where: {
            moduleProgress: {
                some: {
                    moduleId: 'cmll8lo3d001d4fzxib3kez4j',
                    status: 'COMPLETED'
                }
            }
        }
    });

    console.log(`Users who completed Mod 6:`);
    usersCompletedMod6.forEach(u => {
        console.log(`${u.name} | ${u.email} | ID: ${u.id}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
