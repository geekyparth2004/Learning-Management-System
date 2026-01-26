
import { db } from "../lib/db";

async function main() {
    const problems = await db.problem.findMany({
        where: {
            videoSolution: {
                not: null
            }
        },
        select: {
            id: true,
            title: true,
            videoSolution: true
        },
        take: 5
    });

    console.log("Practice Problems with Video Solutions:");
    problems.forEach(p => {
        console.log(`Title: ${p.title}`);
        console.log(`URL: ${p.videoSolution}`);
        console.log('---');
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await db.$disconnect());
