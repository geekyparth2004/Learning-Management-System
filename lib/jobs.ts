
import { db } from "@/lib/db";

// Mock data generator for simulation
const MOCK_JOBS = [
    {
        title: "Frontend Developer (React.js)",
        company: "Swiggy",
        location: "Bengaluru, India",
        salary: "₹12L - ₹18L",
        link: "https://www.linkedin.com/jobs/search/?keywords=frontend",
        platform: "LinkedIn"
    },
    {
        title: "Backend Engineer (Node.js)",
        company: "Zomato",
        location: "Gurugram, India",
        salary: "₹15L - ₹22L",
        link: "https://www.naukri.com/node-js-jobs",
        platform: "Naukri"
    },
    {
        title: "Full Stack Developer",
        company: "Cred",
        location: "Bengaluru (Remote)",
        salary: "₹20L - ₹30L",
        link: "https://wellfound.com/jobs",
        platform: "Wellfound"
    },
    {
        title: "SDE-1 Intern",
        company: "Razorpay",
        location: "Bengaluru",
        salary: "₹40k/month",
        link: "https://razorpay.com/jobs",
        platform: "Careers Page"
    },
    {
        title: "Junior Web Developer",
        company: "Tech Mahindra",
        location: "Pune",
        salary: "₹4L - ₹6L",
        link: "https://www.naukri.com/",
        platform: "Naukri"
    }
];

export async function refreshJobs() {
    try {
        // 1. Check if we have recent jobs (created in last 24h)
        const yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
        const existingJobs = await db.job.findFirst({
            where: {
                createdAt: { gt: yesterday }
            }
        });

        if (existingJobs) {
            console.log("Using cached jobs");
            return;
        }

        console.log("Refreshing job cache...");

        // 2. Clear old jobs to keep DB clean (Optional, or keep history)
        // await db.job.deleteMany({}); 

        // 3. "Fetch" new jobs (Mocked here, replace with API call later)
        // In real world: const res = await fetch(SERP_API_URL)...
        const newJobs = MOCK_JOBS.map(job => ({
            ...job,
            postedAt: new Date() // Simulate "just now"
        }));

        // 4. Save to DB
        // Using createMany ensures efficiency
        await db.job.createMany({
            data: newJobs
        });

    } catch (error) {
        console.error("Failed to refresh jobs:", error);
    }
}

export async function getRecommendedJobs() {
    // Ensure we have fresh data
    await refreshJobs();

    // Fetch and return
    return await db.job.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });
}
