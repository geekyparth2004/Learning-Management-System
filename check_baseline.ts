
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const email = "aids22013@gmail.com";
    const user = await prisma.user.findUnique({
        where: { email },
        select: { codolioBaseline: true, externalRatings: true }
    });

    if (!user) {
        console.log("User not found");
    } else {
        console.log(`Baseline: ${user.codolioBaseline}`);
        console.log(`Current External Stats:`, user.externalRatings);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
