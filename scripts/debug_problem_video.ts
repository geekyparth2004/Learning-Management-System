
import { db } from "@/lib/db";
import fs from "fs";

async function main() {
    try {
        // Find many instead of first to debug
        const problems = await db.problem.findMany({
            where: { title: { contains: "Find" } }
        });

        if (problems.length === 0) {
            console.log("No problems found with 'Find' in title.");
        } else {
            const output = JSON.stringify(problems.map(p => ({
                id: p.id,
                title: p.title,
                videoSolution: p.videoSolution
            })), null, 2);
            fs.writeFileSync("debug_output.txt", output);
            console.log("Output written to debug_output.txt");
        }
    } catch (error) {
        console.error("Error fetching problem:", error);
    }
}

main();
