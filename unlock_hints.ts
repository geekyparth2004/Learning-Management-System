
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const studentEmail = "student2@test.com"; // The student we created earlier

    const user = await prisma.user.findUnique({
        where: { email: studentEmail },
    });

    if (!user) {
        console.error("Student not found");
        return;
    }

    // Find the most recent assignment progress
    const progress = await prisma.assignmentProgress.findFirst({
        where: { userId: user.id },
        orderBy: { startedAt: 'desc' }
    });

    if (!progress) {
        console.error("No assignment progress found for student");
        return;
    }

    // Update startedAt to 30 minutes ago to unlock all hints (assuming 5 min intervals for 4 hints = 20 mins max)
    await prisma.assignmentProgress.update({
        where: { id: progress.id },
        data: {
            startedAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
        }
    });

    console.log("Updated assignment progress to unlock all hints.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
