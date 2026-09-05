import { db } from "@/lib/db";

/**
 * Fetch all jobs posted by teachers, newest first.
 */
export async function getAllJobs() {
    const jobs = await (db as any).job.findMany({
        orderBy: { createdAt: "desc" },
    });
    return jobs;
}
