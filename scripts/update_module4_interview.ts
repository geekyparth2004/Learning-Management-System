
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("Searching for 'Module 4'...");

    // Find module first
    const modules = await prisma.module.findMany({
        where: {
            title: {
                contains: "Module 4"
            }
        },
        include: {
            items: true
        }
    });

    if (modules.length === 0) {
        console.log("No module found with 'Module 4' in title.");
        return;
    }

    for (const module of modules) {
        console.log(`Found Module: ${module.title} (${module.id})`);

        // Find interview item
        const interviewItem = module.items.find((item: any) =>
            item.type === "AI_INTERVIEW" || item.title.toLowerCase().includes("interview")
        );

        if (interviewItem) {
            console.log(`  Found Interview Item: ${interviewItem.title} (${interviewItem.id})`);
            console.log(`  Current Topic: ${interviewItem.aiInterviewTopic}`);
            console.log(`  Current Difficulty: ${interviewItem.aiDifficulty}`);

            // Update
            const updated = await prisma.moduleItem.update({
                where: { id: interviewItem.id },
                data: {
                    aiInterviewTopic: "Basics syntax of Java, loops, if and else statement, nested if else, ternary operator in Java",
                    aiDifficulty: "Basic"
                }
            });
            console.log(`  UPDATED to: '${updated.aiInterviewTopic}' (Basic)`);
        } else {
            console.log("  No AI Interview item found in this module.");
        }
    }
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
