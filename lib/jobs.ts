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

const MOCK_JOBS = [
    { title: "Frontend Developer", company: "Google", location: "Bengaluru", salary: "₹18L - ₹35L", platform: "Careers Page", link: "https://www.google.com/about/careers/applications/jobs/results/?location=India&q=Frontend%20Developer" },
    { title: "Backend SDE-1", company: "Amazon", location: "Hyderabad", salary: "₹25L - ₹45L", platform: "Careers Page", link: "https://www.amazon.jobs/en/search?base_query=Software+Development+Engineer&loc_query=India" },
    { title: "Full Stack Engineer", company: "Microsoft", location: "Bengaluru", salary: "₹20L - ₹40L", platform: "Careers Page", link: "https://careers.microsoft.com/us/en/search-results?keywords=Full%20Stack&p=India" },
    { title: "SDE-2 (Java)", company: "Flipkart", location: "Bengaluru", salary: "₹28L - ₹50L", platform: "Careers Page", link: "https://www.flipkartcareers.com/#!/joblist?keywords=Java" },
    { title: "Product Engineer", company: "Swiggy", location: "Bengaluru", salary: "₹15L - ₹30L", platform: "Careers Page", link: "https://careers.swiggy.com/#/careers" },
    { title: "Senior Software Engineer", company: "Zomato", location: "Gurugram", salary: "₹20L - ₹40L", platform: "LinkedIn", link: "https://www.linkedin.com/jobs/search/?keywords=Zomato%20Software%20Engineer" },
    { title: "Data Scientist", company: "Uber", location: "Bengaluru", salary: "₹25L - ₹45L", platform: "Careers Page", link: "https://www.uber.com/global/en/careers/list/?location=India&department=Data%20Science" },
    { title: "System Engineer", company: "TCS", location: "Pune", salary: "₹4L - ₹8L", platform: "Naukri", link: "https://www.naukri.com/tcs-jobs" },
    { title: "Java Developer", company: "Infosys", location: "Mysore", salary: "₹5L - ₹9L", platform: "Naukri", link: "https://www.naukri.com/infosys-jobs" },
    { title: "DevOps Engineer", company: "Cred", location: "Bengaluru", salary: "₹20L - ₹40L", platform: "LinkedIn", link: "https://www.linkedin.com/jobs/search/?keywords=Cred%20DevOps" },
    { title: "Software Engineer", company: "Google", location: "Hyderabad", salary: "₹18L - ₹35L", platform: "Careers Page", link: "https://www.google.com/about/careers/applications/jobs/results/?location=India&q=Software%20Engineer" },
    { title: "SDE-1", company: "Amazon", location: "Bengaluru", salary: "₹20L - ₹35L", platform: "Careers Page", link: "https://www.amazon.jobs/en/search?base_query=SDE&loc_query=India" },
    { title: "Frontend Engineer", company: "Atlassian", location: "Bengaluru", salary: "₹24L - ₹48L", platform: "Careers Page", link: "https://www.atlassian.com/company/careers/all-jobs?location=Bengaluru&team=Engineering" },
    { title: "Python Developer", company: "Razorpay", location: "Bengaluru", salary: "₹15L - ₹30L", platform: "LinkedIn", link: "https://www.linkedin.com/jobs/search/?keywords=Razorpay%20Python" },
    { title: "Android Developer", company: "Hotstar", location: "Mumbai", salary: "₹18L - ₹32L", platform: "Naukri", link: "https://www.naukri.com/hotstar-jobs" }
].map(j => ({ ...j, postedAt: new Date() }));

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
