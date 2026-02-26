const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { BADGE_DEFINITIONS } = require('./lib/badges.ts');

async function main() {
    const userId = "cmipqlrfe000awpjht3jytlhs";

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
        console.log("Is HTML_COMPLETION earned in Mapped?", mapped.some(b => b.id === "HTML_COMPLETION"));
    } catch (e) {
        console.log("Error mapping:", e.message);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
