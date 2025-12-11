import { db } from "@/lib/db";

// JSearch API Configuration
const RAPID_API_HOST = "jsearch.p.rapidapi.com";

// User-requested categories
const JOB_CATEGORIES = [
    "C++ Developer",
    "Java Developer",
    "Frontend Developer",
    "Backend Developer",
    "SQL Developer",
    "SDE 1",
    "Python Developer in India"
];

// Mock data generator for simulation (Fallback) - Expanded to 30 items
const MOCK_TITLES = ["Frontend Developer", "Backend Developer", "Full Stack Engineer", "SDE-1", "SDE-2", "DevOps Engineer", "Data Scientist", "System Analyst"];
const MOCK_COMPANIES = ["Google", "Amazon", "Microsoft", "Flipkart", "Swiggy", "Zomato", "Cred", "Razorpay", "Uber", "Ola"];
const MOCK_LOCATIONS = ["Bengaluru", "Hyderabad", "Pune", "Gurugram", "Mumbai", "Remote"];

const MOCK_JOBS = Array.from({ length: 30 }).map((_, i) => {
    const title = `${MOCK_TITLES[i % MOCK_TITLES.length]}`;
    return {
        title: title,
        company: MOCK_COMPANIES[i % MOCK_COMPANIES.length],
        location: MOCK_LOCATIONS[i % MOCK_LOCATIONS.length],
        salary: `₹${12 + (i % 20)}L - ₹${18 + (i % 20)}L`,
        link: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(title)}`,
        platform: i % 3 === 0 ? "LinkedIn" : i % 3 === 1 ? "Naukri" : "Careers Page"
    };
});

async function fetchJobsForQuery(query: string, apiKey: string) {
    const url = `https://${RAPID_API_HOST}/search?query=${encodeURIComponent(query + " in India")}&num_pages=1&date_posted=today`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': RAPID_API_HOST
            }
        });

        if (!response.ok) return [];

        const result = await response.json();
        if (!result.data || !Array.isArray(result.data)) return [];

        console.log(`API returned ${result.data.length} jobs for ${query}`); // Debug log

        return result.data.map((job: any) => ({
            title: job.job_title,
            company: job.employer_name,
            location: job.job_city ? `${job.job_city}, ${job.job_country}` : (job.job_country || "India"),
            salary: job.job_min_salary ? `₹${job.job_min_salary} - ₹${job.job_max_salary}` : "Not Disclosed",
            link: job.job_apply_link,
            platform: job.job_publisher || "LinkedIn",
            postedAt: new Date()
        }));
    } catch (error) {
        console.error(`Failed to fetch for ${query}:`, error);
        return [];
    }
}

export async function refreshJobs() {
    try {
        // 1. Check if we have recent jobs (Midnight IST Strategy)
        // We want to fetch new jobs if the current cached jobs were created BEFORE today's midnight IST.

        const now = new Date();
        // IST is UTC + 5:30. 
        // We calculate "Midnight IST Today" in UTC time.
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istTime = new Date(now.getTime() + istOffset);
        istTime.setUTCHours(0, 0, 0, 0); // Midnight in IST terms

        // This is the collection cutoff. Any job created BEFORE this timestamp is "yesterday's news".
        const midnightIstInUtc = new Date(istTime.getTime() - istOffset);

        const jobsCount = await (db as any).job.count({
            where: { createdAt: { gt: midnightIstInUtc } }
        });

        // ONLY return if we have enough jobs for "Today"
        if (jobsCount > 10) {
            console.log("Using cached jobs (Fresh for Today IST)");
            return;
        }

        console.log("Refreshing job cache (New Day in IST)...");
        const apiKey = process.env.RAPID_API_KEY;

        let newJobs: any[] = [];

        if (apiKey) {
            // Pick 3 random categories to fetch
            const shuffled = [...JOB_CATEGORIES].sort(() => 0.5 - Math.random());
            const selectedCategories = shuffled.slice(0, 3);

            console.log(`Fetching jobs for: ${selectedCategories.join(", ")}`);

            const promises = selectedCategories.map(cat => fetchJobsForQuery(cat, apiKey));
            const results = await Promise.all(promises);

            newJobs = results.flat();
        }

        // 3. Fallback to Mock if API failed or no key or no results
        if (!newJobs || newJobs.length === 0) {
            console.log("Using Mock Data fallback.");
            newJobs = MOCK_JOBS.map(job => ({ ...job, postedAt: new Date() }));
        }

        // 4. Save to DB
        // Clear previous entries to force fresh start
        await (db as any).job.deleteMany({});

        await (db as any).job.createMany({
            data: newJobs,
            skipDuplicates: true
        });

    } catch (error) {
        console.error("Failed to refresh jobs:", error);
    }
}

export async function getRecommendedJobs() {
    try {
        await refreshJobs();

        // Fetch
        const jobs = await (db as any).job.findMany({
            orderBy: { createdAt: 'desc' },
            take: 40
        });

        if (jobs && jobs.length > 0) return jobs;

    } catch (error) {
        console.error("Database fetch failed");
    }

    return MOCK_JOBS.map((job, index) => ({
        id: `mock-${index}`,
        ...job,
        postedAt: new Date(),
        createdAt: new Date()
    }));
}
