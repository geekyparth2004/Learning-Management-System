
import { db } from "../lib/db";

async function main() {
    const problem = await db.problem.findFirst({
        where: { title: "Find the fine" }
    });

    if (problem) {
        console.log("VIDEO_URL_START");
        console.log(problem.videoSolution);
        console.log("VIDEO_URL_END");
    } else {
        console.log("PROBLEM_NOT_FOUND");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await db.$disconnect());
