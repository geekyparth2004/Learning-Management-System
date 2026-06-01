import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "COORDINATOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { organizationId: true },
        });

        if (!user?.organizationId) {
            return NextResponse.json({ error: "No organization" }, { status: 403 });
        }

        const orgId = user.organizationId;

        // === OVERVIEW STATS ===
        const [totalStudents, placedApps, totalApps, drives] = await Promise.all([
            db.user.count({
                where: { organizationId: orgId, role: "STUDENT" },
            }),
            db.placementApplication.count({
                where: {
                    drive: { organizationId: orgId },
                    status: "PLACED",
                },
            }),
            db.placementApplication.count({
                where: { drive: { organizationId: orgId } },
            }),
            db.recruitmentDrive.findMany({
                where: { organizationId: orgId, isDraft: false },
                select: {
                    id: true,
                    company: true,
                    role: true,
                    status: true,
                    driveDate: true,
                    createdAt: true,
                    _count: { select: { applications: true } },
                },
            }),
        ]);

        const selectionRate = totalStudents > 0
            ? Math.round((placedApps / totalStudents) * 1000) / 10
            : 0;

        // Unique companies (recruiters)
        const uniqueCompanies = [...new Set(drives.map((d) => d.company))];

        // === DEPARTMENT-WISE STATS ===
        // Get all students in org with their placement profile and application status
        const studentsWithDept = await db.user.findMany({
            where: { organizationId: orgId, role: "STUDENT" },
            select: {
                id: true,
                placementProfile: { select: { department: true } },
                placementApplications: {
                    select: { status: true },
                },
            },
        });

        const deptMap: Record<string, { total: number; placed: number }> = {};
        for (const s of studentsWithDept) {
            const dept = s.placementProfile?.department || "Unknown";
            if (!deptMap[dept]) deptMap[dept] = { total: 0, placed: 0 };
            deptMap[dept].total += 1;
            // A student is "placed" if they have at least one PLACED application
            if (s.placementApplications.some((a) => a.status === "PLACED")) {
                deptMap[dept].placed += 1;
            }
        }

        const departments = Object.entries(deptMap)
            .map(([name, data]) => ({
                name,
                total: data.total,
                placed: data.placed,
                rate: data.total > 0 ? Math.round((data.placed / data.total) * 100) : 0,
            }))
            .sort((a, b) => b.rate - a.rate);

        // === COMPANY INSIGHTS ===
        // Group applications by drive company
        const allApplications = await db.placementApplication.findMany({
            where: { drive: { organizationId: orgId } },
            select: {
                status: true,
                appliedAt: true,
                drive: {
                    select: { company: true, status: true },
                },
            },
        });

        const companyMap: Record<string, {
            total: number;
            placed: number;
            shortlisted: number;
            rejected: number;
            driveStatus: string;
        }> = {};

        for (const app of allApplications) {
            const company = app.drive.company;
            if (!companyMap[company]) {
                companyMap[company] = { total: 0, placed: 0, shortlisted: 0, rejected: 0, driveStatus: app.drive.status };
            }
            companyMap[company].total += 1;
            if (app.status === "PLACED") companyMap[company].placed += 1;
            if (app.status === "SHORTLISTED") companyMap[company].shortlisted += 1;
            if (app.status === "REJECTED") companyMap[company].rejected += 1;
        }

        const companies = Object.entries(companyMap)
            .map(([name, data]) => ({
                name,
                totalApplications: data.total,
                selections: data.placed,
                shortlisted: data.shortlisted,
                rejected: data.rejected,
                status: data.driveStatus === "COMPLETED" ? "Closed" : "Active",
            }))
            .sort((a, b) => b.selections - a.selections);

        // === PLACEMENT TRENDS (by year) ===
        const placedApplications = await db.placementApplication.findMany({
            where: {
                drive: { organizationId: orgId },
                status: "PLACED",
            },
            select: { appliedAt: true },
        });

        const yearMap: Record<string, number> = {};
        for (const app of placedApplications) {
            const year = new Date(app.appliedAt).getFullYear().toString();
            yearMap[year] = (yearMap[year] || 0) + 1;
        }

        // Ensure we have at least the current year
        const currentYear = new Date().getFullYear().toString();
        if (!yearMap[currentYear]) yearMap[currentYear] = 0;

        const trendYears = Object.keys(yearMap).sort();
        const trendValues = trendYears.map((y) => yearMap[y]);

        // === STUDENT HISTORY (recent applications) ===
        const recentApplications = await db.placementApplication.findMany({
            where: { drive: { organizationId: orgId } },
            orderBy: { appliedAt: "desc" },
            take: 20,
            select: {
                id: true,
                status: true,
                appliedAt: true,
                updatedAt: true,
                user: {
                    select: {
                        name: true,
                        email: true,
                        placementProfile: { select: { department: true, batch: true } },
                    },
                },
                drive: {
                    select: { company: true, role: true },
                },
            },
        });

        const studentHistory = recentApplications.map((app) => ({
            id: app.id,
            studentName: app.user.name || "Unknown",
            studentEmail: app.user.email,
            department: app.user.placementProfile?.department || "—",
            batch: app.user.placementProfile?.batch || "—",
            company: app.drive.company,
            role: app.drive.role,
            status: app.status,
            appliedAt: app.appliedAt,
            updatedAt: app.updatedAt,
        }));

        // === RECENT ACTIVITIES for dashboard ===
        const recentActivities = recentApplications.slice(0, 8).map((app) => ({
            id: app.id,
            studentName: app.user.name || "Unknown",
            action: `Applied for ${app.drive.role} at ${app.drive.company}`,
            status: app.status,
            time: app.appliedAt,
        }));

        return NextResponse.json({
            overview: {
                totalStudents,
                placedStudents: placedApps,
                totalApplications: totalApps,
                selectionRate,
                recruiters: uniqueCompanies.length,
                activeDrives: drives.filter((d) => d.status !== "COMPLETED").length,
            },
            departments,
            companies,
            trends: {
                years: trendYears,
                values: trendValues,
            },
            studentHistory,
            recentActivities,
        });
    } catch (error) {
        console.error("Reports API error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
