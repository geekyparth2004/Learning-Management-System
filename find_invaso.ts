
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const contest = await prisma.contest.findFirst({
        where: { title: { contains: "Invaso", mode: "insensitive" } }
    });

    if (!contest) {
        console.log("Contest not found");
    } else {
        console.log("Found Contest:", contest);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
