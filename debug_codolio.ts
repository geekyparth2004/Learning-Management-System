
import { fetchCodolioStats } from "./lib/codolio";

async function main() {
    const username = "5Ogd15GE";
    console.log(`Fetching stats for ${username}...`);
    try {
        const stats = await fetchCodolioStats(username);
        console.log("Result:", JSON.stringify(stats, null, 2));
    } catch (error) {
        console.error("Error:", error);
    }
}

main();
