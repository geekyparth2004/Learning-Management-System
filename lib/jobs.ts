import { db } from "@/lib/db";

// JSearch API Configuration
const RAPID_API_HOST = "jsearch.p.rapidapi.com";

// User-requested categories: Noida, Freshers, Specific Tech, Walk-ins, Specific Platforms
const JOB_CATEGORIES = [
    "Walk-in Drive Freshers Noida Naukri",
    "C++ Developer Entry Level Noida Hirist",
    "Java Developer Fresher Noida Instahyre",
    "Frontend Developer Intern Noida Internshala",
    "SQL Developer Entry Level Noida LinkedIn",
    "Software Engineer Freshers Noida Careers",
    "Junior Developer Noida Naukri",
    "Web Developer Internship Noida Internshala",
    "Backend Developer Fresher Noida Hirist"
];

// Mock data generator for simulation (Fallback) - Tuned for Noida/Freshers
const MOCK_TITLES = ["Junior Software Engineer", "C++ Developer", "Java Developer", "Frontend Intern", "SQL Analyst", "Graduate Trainee"];
const MOCK_COMPANIES = ["HCL Tech", "Paytm", "Samsung", "Adobe", "InfoEdge", "Oracle", "Cadence"];
const MOCK_LOCATIONS = ["Noida", "Greater Noida", "Delhi NCR", "Gurugram"];

const MOCK_JOBS = [
    { title: "C++ Developer (Fresher)", company: "HCL Tech", location: "Noida", salary: "₹4L - ₹6L", platform: "Careers Page", link: "https://www.hcltech.com/careers" },
    { title: "Java Developer", company: "Paytm", location: "Noida", salary: "₹8L - ₹12L", platform: "Careers Page", link: "https://paytm.com/careers" },
    { title: "Software Engineer (Entry Level)", company: "Samsung", location: "Noida", salary: "₹12L - ₹18L", platform: "Careers Page", link: "https://www.samsung.com/in/about-us/careers/" },
    { title: "Frontend Developer", company: "InfoEdge", location: "Noida", salary: "₹6L - ₹10L", platform: "Naukri", link: "https://www.naukri.com/infoedge-jobs" },
    { title: "SQL Developer", company: "Oracle", location: "Noida", salary: "₹10L - ₹15L", platform: "Careers Page", link: "https://www.oracle.com/in/corporate/careers/" },
    { title: "Walk-in: Graduate Trainee", company: "Genpact", location: "Noida", salary: "₹3L - ₹5L", platform: "Naukri", link: "https://www.genpact.com/careers" },
    { title: "Junior Web Developer", company: "Adobe", location: "Noida", salary: "₹15L - ₹25L", platform: "Careers Page", link: "https://careers.adobe.com/us/en" },
    { title: "C++ Intern", company: "Cadence", location: "Noida", salary: "₹30k/mo", platform: "Careers Page", link: "https://careers.cadence.com/" },
].map(j => ({ ...j, postedAt: new Date() }));

async function fetchJobsForQuery(query: string, apiKey: string) {
    // We search exact query since it already contains "Noida"
    const url = `https://${RAPID_API_HOST}/search?query=${encodeURIComponent(query)}&num_pages=1&date_posted=today`;

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
        // Force refresh to apply new Noida search criteria
        // (Skipping the midnight check to ensure user gets new results immediately)
        /*
        const jobCountCheck = await (db as any).job.count();
        if (jobCountCheck > 10 && process.env.RAPID_API_KEY) {
             return; // Disabled for immediate update
        }
        */

        console.log("Refreshing job cache (Forcing Noida Update)...");
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

        // 3. Fallback to Mock if API failed or no key
        if (!newJobs || newJobs.length === 0) {
            console.log("Using Mock Data fallback.");
            newJobs = MOCK_JOBS.map(job => ({ ...job, postedAt: new Date() }));
        }

        // 4. Save to DB
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
