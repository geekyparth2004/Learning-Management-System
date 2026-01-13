
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const targetId = "cmj7b96lr001t6j0mnbdoz7js"; // Identified from previous list
    console.log(`Updating Interview Item [${targetId}]...`);

    const updated = await prisma.moduleItem.update({
        where: { id: targetId },
        data: {
            aiInterviewTopic: "Basics syntax of Java, loops, if and else statement, nested if else, ternary operator in Java",
            aiDifficulty: "Basic"
        }
    });

    console.log("UPDATE SUCCESSFUL:");
    console.log(`  Title: ${updated.title}`);
    console.log(`  New Topic: ${updated.aiInterviewTopic}`);
    console.log(`  New Difficulty: ${updated.aiDifficulty}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

export { };
