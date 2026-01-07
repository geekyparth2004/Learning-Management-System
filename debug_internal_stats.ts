
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const email = "aids22013@gmail.com";
    console.log(`Investigating stats for ${email}...`);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.log("User not found");
        return;
    }

    console.log(`User ID: ${user.id}`);

    // Fetch all PASSED submissions
    const submissions = await prisma.submission.findMany({
        where: {
            userId: user.id,
            status: "PASSED"
        },
        select: {
            problemId: true,
            problem: {
                select: { title: true }
            },
            createdAt: true
        },
        orderBy: { createdAt: 'desc' }
    });

    console.log(`Total PASSED submissions (raw rows): ${submissions.length}`);

    // Group by problemId to find unique
    const uniqueProblems = new Map<string, string>();
    submissions.forEach(s => {
        if (!uniqueProblems.has(s.problemId)) {
            uniqueProblems.set(s.problemId, s.problem.title);
        }
    });

    console.log(`Unique Problems Solved: ${uniqueProblems.size}`);
    console.log("--- List of Problems ---");
    let i = 1;
    uniqueProblems.forEach((title, id) => {
        console.log(`${i++}. ${title} (ID: ${id})`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
