const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const userId = "cmipqlrfe000awpjht3jytlhs";

    const hasCompletedHTML = await prisma.moduleProgress.findUnique({
        where: {
            userId_moduleId: {
                userId,
                moduleId: "cmll8lo3d001d4fzxib3kez4j",
            },
        },
    });

    console.log("HTML Completion query:", hasCompletedHTML);

    const existingBadges = await prisma.userBadge.findMany({
        where: { userId },
        select: { badgeType: true }
    });

    console.log("Existing badges before check:", existingBadges.map(b => b.badgeType));

    const earnedBadgeTypes = new Set(existingBadges.map(b => b.badgeType));
    const newlyEarnedBadges = [];

    if (!earnedBadgeTypes.has("HTML_COMPLETION")) {
        if (hasCompletedHTML?.status === "COMPLETED") {
            console.log("Awarding HTML badge!");
            await prisma.userBadge.create({
                data: {
                    userId,
                    badgeType: "HTML_COMPLETION",
                },
            });
            newlyEarnedBadges.push("HTML_COMPLETION");
        }
    }

    console.log("Newly earned badges:", newlyEarnedBadges);
}

main().catch(console.error).finally(() => prisma.$disconnect());
