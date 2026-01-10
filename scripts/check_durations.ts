import { db } from "../lib/db";

async function main() {
    const items = await db.moduleItem.findMany({
        select: { id: true, title: true, type: true, duration: true }
    });

    const total = items.length;
    const zeroDuration = items.filter(i => i.duration === 0);
    const videos = items.filter(i => i.type === "VIDEO");
    const zeroDurationVideos = videos.filter(i => i.duration === 0);

    console.log(`Total Items: ${total}`);
    console.log(`Items with Duration 0: ${zeroDuration.length}`);
    console.log(`Total Videos: ${videos.length}`);
    console.log(`Videos with Duration 0: ${zeroDurationVideos.length}`);

    if (zeroDurationVideos.length > 0) {
        console.log("Example Zero Duration Videos:");
        zeroDurationVideos.slice(0, 5).forEach(v => console.log(`- ${v.title}`));
    }
}

main();
