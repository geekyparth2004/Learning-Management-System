
import dotenv from 'dotenv';
dotenv.config();

import { db } from "../lib/db";

async function main() {
    console.log("Listing all courses...");
    const courses = await db.course.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            teacher: { select: { name: true } },
            _count: { select: { modules: true } }
        }
    });

    console.log(`Found ${courses.length} courses.`);
    console.table(courses.map(c => ({
        ID: c.id,
        Title: c.title,
        Teacher: c.teacher.name,
        Modules: c._count.modules,
        CreatedAt: c.createdAt
    })));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await db.$disconnect());
