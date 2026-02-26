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

    console.log(`Found ${usersCompletedMod6.length} users who completed Module 6.`);
    for (const u of usersCompletedMod6) {
        await prisma.userBadge.upsert({
            where: {
                userId_badgeType: {
                    userId: u.id,
                    badgeType: 'HTML_COMPLETION'
                }
            },
            update: {},
            create: {
                userId: u.id,
                badgeType: 'HTML_COMPLETION'
            }
        });
        console.log(`Awarded HTML Expert badge to ${u.email}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
