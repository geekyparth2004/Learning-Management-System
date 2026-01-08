
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const email = "aids22013@gmail.com";
    console.log(`Updating baseline for ${email}...`);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.log("User not found!");
        // Try the gmail one just in case user made a typo, but don't act on it without asking.
        const gmailUser = await prisma.user.findUnique({ where: { email: "aids22013@gmail.com" } });
        if (gmailUser) console.log("Did you mean aids22013@gmail.com? Found that one.");
        return;
    }

    console.log(`Current Baseline: ${user.codolioBaseline}`);
    console.log(`Current Stats:`, user.externalRatings);

    const updated = await prisma.user.update({
        where: { email },
        data: { codolioBaseline: 455 }
    });

    console.log(`New Baseline: ${updated.codolioBaseline}`);

    // Calculate new theoretical diff
    const stats: any = updated.externalRatings || {};
    const currentTotal = stats.totalQuestions || 0;
    const diff = Math.max(0, currentTotal - 455);
    console.log(`Theoretical added score: ${diff} (Current Total ${currentTotal} - 455)`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
