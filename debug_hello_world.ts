
import { db } from "./lib/db";

async function main() {
    try {
        const problems = await db.problem.findMany({
            where: {
                title: {
                    contains: "Hello World"
                }
            }
        });
        console.log("Found problems:", JSON.stringify(problems, null, 2));
    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit();
    }
}

main();
