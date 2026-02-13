import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
    const email = "akshatjain251007@gmail.com";
    const newPassword = "1234";

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user
    const user = await db.user.update({
        where: { email },
        data: { password: hashedPassword },
    });

    console.log(`Password for ${user.name} (${user.email}) has been reset to: ${newPassword}`);

    await db.$disconnect();
}

main().catch((e) => {
    console.error(e);
    db.$disconnect();
    process.exit(1);
});
