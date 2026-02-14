import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
    const email = "akshatjain251007@gmail.com";
    const user = await db.user.findUnique({
        where: { email },
        select: {
            id: true,
            currentStreak: true,
            lastActivityDate: true
        }
    });

    console.log(JSON.stringify(user, null, 2));
    await db.$disconnect();
}

main();
