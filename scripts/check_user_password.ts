import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
    const user = await db.user.findUnique({
        where: { email: "akshatjain251007@gmail.com" },
        select: { id: true, email: true, password: true, name: true }
    });

    console.log("User details:", JSON.stringify(user, null, 2));

    await db.$disconnect();
}

main();
