
async function main() {
    const username = "5Ogd15GE";
    const response = await fetch(`https://api.codolio.com/profile?userKey=${username}`);
    const json = await response.json();
    const data = json.data;

    if (!data) {
        console.log("Data is undefined/null. Full JSON:", JSON.stringify(json, null, 2));
        return;
    }

    console.log("Top level contestActivityStats:", JSON.stringify(data.contestActivityStats, null, 2));
    console.log("platformProfiles type:", typeof data.platformProfiles);
    console.log("Is array?", Array.isArray(data.platformProfiles));
    if (!Array.isArray(data.platformProfiles)) {
        console.log("platformProfiles CONTENT:", JSON.stringify(data.platformProfiles, null, 2));
        if (data.platformProfiles?.platformProfiles && Array.isArray(data.platformProfiles.platformProfiles)) {
            console.log("FOUND NESTED ARRAY at data.platformProfiles.platformProfiles");
        }
    }

    if (data.platformProfiles && Array.isArray(data.platformProfiles)) {
        data.platformProfiles.forEach((p: any) => {
            console.log(`Platform: ${p.platform}`);
            console.log("Contest Activity:", JSON.stringify(p.contestActivityStats, null, 2));
            if (p.contestActivityStats?.contestActivityList) {
                console.log(`Count: ${p.contestActivityStats.contestActivityList.length}`);
            }
            console.log("---");
        });
    }
}
main();
