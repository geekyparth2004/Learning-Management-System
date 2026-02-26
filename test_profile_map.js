const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { BADGE_DEFINITIONS } = require('./lib/badges.ts');

async function main() {
    const userId = "cmipqlrfe000awpjht3jytlhs";

    // Simulation of getUserBadges since we can't easily import TS compiler into raw Node without ts-node
    const userBadges = await prisma.userBadge.findMany({
        where: { userId },
        orderBy: { earnedAt: 'desc' }
    });

    console.log("Raw DB badges:", userBadges);

    try {
        const mapped = userBadges.map(ub => ({
            ...BADGE_DEFINITIONS[ub.badgeType],
            earnedAt: ub.earnedAt
        }));
        console.log("Mapped Badges for Frontend:", mapped);
        console.log("Is HTML_COMPLETION earned?", mapped.some(b => b.id === "HTML_COMPLETION"));
    } catch (e) {
        console.log("Could not map definitions directly in this script:", e.message);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
