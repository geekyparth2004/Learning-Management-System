
import { db } from "../lib/db";
import { signR2Url } from "../lib/s3";

async function main() {
    const email = "khushboodixit4687@gmail.com";
    console.log("Finding user...");
    const user = await db.user.findUnique({ where: { email } });
    if (!user) { console.error("User not found"); return; }

    const userId = user.id;
    // Find the course (assuming DSA course based on previous context)
    console.log("Finding course...");
    const course = await db.course.findFirst({
        where: { title: "Data Structure and Algorithm with Java" },
        include: {
            modules: {
                orderBy: { order: "asc" },
                include: {
                    items: {
                        orderBy: { order: "asc" },
                        include: {
                            testProblems: { include: { testCases: true } },
                            assignment: { include: { problems: { include: { testCases: true } } } }
                        }
                    },
                },
            },
        },
    });

    if (!course) { console.error("Course not found"); return; }
    console.log(`Course Found: ${course.id}`);

    // Simulate API Logic
    console.log("Fetching Progress...");
    const moduleProgress = await db.moduleProgress.findMany({
        where: { userId, module: { courseId: course.id } },
    });

    const itemProgress = await db.moduleItemProgress.findMany({
        where: { userId, moduleItem: { module: { courseId: course.id } } },
    });

    console.log(`Progress Loaded: ${moduleProgress.length} modules, ${itemProgress.length} items`);

    console.log("Processing Modules...");
    const modulesWithProgress = await Promise.all(course.modules.map(async (m, index) => {
        // ... (Simplified logic from route.ts)
        const progress = moduleProgress.find(mp => mp.moduleId === m.id);
        let status = progress?.status || "LOCKED";

        // Items Processing
        const items = await Promise.all(m.items.map(async i => {
            // Sign URL check simulation
            if (i.content && (i.content.includes("r2.cloudflarestorage.com") || i.content.includes("backblazeb2.com"))) {
                // console.log(`Signing URL for ${i.title}`);
                // await signR2Url(i.content); // Commented out to test logic first, uncomment if logic passes
            }
            return { id: i.id, title: i.title };
        }));

        return {
            id: m.id,
            title: m.title,
            status,
            itemsCount: items.length
        };
    }));

    console.log("Processing Complete.");
    modulesWithProgress.forEach(m => console.log(`[${m.status}] ${m.title}`));
}

// Mock signR2Url if needed or import real one if environment allows
// For now assuming the import works or we skip it.

main()
    .catch(e => console.error(e))
    .finally(async () => await db.$disconnect());
