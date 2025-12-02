import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const envPath = path.join(process.cwd(), ".env");
console.log("Loading .env from:", envPath);
if (fs.existsSync(envPath)) {
    console.log(".env file exists");
    dotenv.config({ path: envPath });
} else {
    console.log(".env file NOT found");
}

console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Loaded" : "Not Loaded");
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const email = "goelparth20049@gmail.com";
    const password = "parth1234";
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            name: "Parth Goel",
            password: hashedPassword,
            role: "TEACHER",
        },
    });

    console.log({ user });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
