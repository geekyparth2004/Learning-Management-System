
import { db } from "../lib/db";

async function main() {
    const problem = await db.problem.findFirst({
        where: {
            title: "Find the fine"
        },
        select: {
            id: true,
            title: true,
            videoSolution: true
        }
    });

    console.log(JSON.stringify(problem, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await db.$disconnect());
