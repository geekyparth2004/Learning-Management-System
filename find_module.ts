import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const course = await prisma.course.findFirst({
        where: {
            title: {
                contains: 'data structure',
                mode: 'insensitive'
            }
        },
        include: {
            modules: {
                orderBy: {
                    order: 'asc'
                }
            }
        }
    });

    if (course) {
        console.log(`Course: ${course.title} (ID: ${course.id})`);
        for (const m of course.modules) {
            console.log(`Module Order: ${m.order}, Title: ${m.title}, ID: ${m.id}`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
