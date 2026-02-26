const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        include: { moduleProgress: true, enrollments: { include: { course: { include: { modules: true } } } } }
    });

    const allBadges = await prisma.userBadge.findMany();

    console.log("Users and their progress:");
    users.forEach(u => {
        console.log(`User: ${u.name} | Email: ${u.email}`);
        const userBadges = allBadges.filter(b => b.userId === u.id);
        console.log(`Badges:`, userBadges.map(b => b.badgeType));
        console.log(`Completed Modules:`, u.moduleProgress.filter(m => m.status === 'COMPLETED').map(m => m.moduleId));
    });

    const courses = await prisma.course.findMany({
        include: {
            modules: {
                orderBy: { order: 'asc' },
                include: { items: true }
            }
        }
    });

    courses.forEach(c => {
        console.log(`\nCourse: ${c.title} (${c.id})`);
        c.modules.forEach((m, idx) => {
            console.log(`  Module ${idx + 1}: ${m.title} (${m.id})`);
        });
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
