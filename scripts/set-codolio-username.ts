
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const email = "aids22013@gmail.com";
    const codolioUsername = "5Ogd15GE";

    console.log(`Updating Codolio username for ${email} to ${codolioUsername}...`);

    try {
        const user = await prisma.user.update({
            where: { email },
            data: { codolioUsername },
        });
        console.log("Success! User updated:", user.id, user.codolioUsername);
    } catch (error) {
        console.error("Error updating user:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
