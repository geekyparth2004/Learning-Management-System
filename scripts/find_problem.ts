
import { db } from "../lib/db";

async function main() {
    const problems = await db.problem.findMany({
        where: {
            title: {
                contains: "Find",
                mode: "insensitive"
            }
        },
        select: {
            id: true,
            title: true,
            videoSolution: true
        }
    });

    console.log("Found Problems:");
    problems.forEach(p => {
        console.log(`- ${p.title} (ID: ${p.id})`);
        console.log(`  Video: ${p.videoSolution}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await db.$disconnect());
