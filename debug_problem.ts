
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const problems = await prisma.problem.findMany({
        where: {
            title: {
                contains: "Grade"
            }
        }
    });

    console.log("Found problems:", problems.length);
    problems.forEach(p => {
        console.log("ID:", p.id);
        console.log("Title:", p.title);
        console.log("Description:", p.description);
        console.log("-------------------");
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
