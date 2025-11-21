import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash("teacher123", 10);
    const teacher = await prisma.user.upsert({
        where: { email: "teacher@example.com" },
        update: {},
        create: {
            name: "Teacher",
            email: "teacher@example.com",
            password: hashedPassword,
            role: "TEACHER",
        },
    });
    console.log("Teacher created:", teacher);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
