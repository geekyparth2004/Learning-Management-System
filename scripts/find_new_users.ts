import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";

const db = new PrismaClient();

async function main() {
    const users = await db.user.findMany({
        where: {
            createdAt: {
                gte: new Date("2026-02-13T00:00:00+05:30"),
            },
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        },
        orderBy: { createdAt: "desc" },
    });

    const output = JSON.stringify(users, null, 2);
    writeFileSync("scripts/new_users_output.json", output);
    console.log("Written to scripts/new_users_output.json");
    console.log(`Total: ${users.length} user(s)`);

    await db.$disconnect();
}

main();
