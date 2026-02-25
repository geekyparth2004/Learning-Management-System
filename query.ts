import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const course = await prisma.course.findFirst({
        where: { title: { contains: 'Web Development', mode: 'insensitive' } },
        include: { modules: { orderBy: { order: 'asc' } } }
    });
    if (course && course.modules.length >= 6) {
        console.log("Course Found:", course.title);
        console.log("Module 6 Title:", course.modules[5].title);
        console.log("Module 6 ID:", course.modules[5].id);
    } else {
        console.log("Course or Module 6 not found.");
    }
}

main().finally(() => prisma.$disconnect());
