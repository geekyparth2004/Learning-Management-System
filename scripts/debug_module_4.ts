
import dotenv from 'dotenv';
dotenv.config();

import { db } from "../lib/db";

async function main() {
    try {
        const email = "khushboodixit4687@gmail.com";

        // 1. Find User
        const user = await db.user.findUnique({
            where: { email },
            include: { enrollments: true }
        });

        if (!user) {
            console.error(`User not found: ${email}`);
            return;
        }
        console.log(`Found User: ${user.name} (${user.id})`);

        // 2. Iterate over enrolled courses
        if (user.enrollments.length === 0) {
            console.log("User has no enrollments.");
            return;
        }

        for (const enrollment of user.enrollments) {
            console.log(`\nChecking Course: ${enrollment.courseId}`);

            const modules = await db.module.findMany({
                where: { courseId: enrollment.courseId },
                orderBy: { order: 'asc' },
                include: {
                    progress: { where: { userId: user.id } },
                    items: {
                        orderBy: { order: 'asc' },
                        include: {
                            progress: { where: { userId: user.id } }
                        }
                    }
                }
            });

            // Filter for Module 4 and 5 (Order 4 and 5 usually, or just index 3 and 4)
            // But let's print all to be sure of the mapping
            modules.forEach(m => {
                const status = m.progress[0]?.status || "LOCKED";
                console.log(`\n[Module Order: ${m.order}] ${m.title} - Status: ${status} (ID: ${m.id})`);

                m.items.forEach(item => {
                    const p = item.progress[0];
                    const isCompleted = p?.isCompleted || false;
                    const reviewStatus = p?.reviewStatus || "N/A";
                    console.log(`  - [Item Order: ${item.order}] ${item.title} (${item.type})`);
                    console.log(`    Completed: ${isCompleted}, Review: ${reviewStatus}, ProgressID: ${p?.id}`);
                    if (item.type === "AI_INTERVIEW") {
                        console.log(`    AI Submission: ${p?.aiSubmission ? "Present" : "Missing"}`);
                    }
                });
            });
        }
    } catch (error) {
        console.error("Script Error:", error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await db.$disconnect());
