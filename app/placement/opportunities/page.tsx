import React from "react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import RecruitmentDrivesSection from "@/components/placement/RecruitmentDrivesSection";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { organizationId: true, placementProfile: { select: { batch: true } } },
    });

    if (!user?.organizationId) redirect("/jobs");

    const batchMatch = user.placementProfile?.batch?.match(/\d{4}/g);
    const userGradYear = batchMatch ? Math.max(...batchMatch.map(Number)) : null;

    const [drives, userApps] = await Promise.all([
        db.recruitmentDrive.findMany({
            where: { 
                organizationId: user.organizationId,
                isDraft: false,
            },
            orderBy: { driveDate: "desc" },
            include: { _count: { select: { applications: true } } },
        }),
        db.placementApplication.findMany({
            where: { userId: session.user.id },
            select: { driveId: true },
        }),
    ]);

    const appliedIds = new Set(userApps.map((a) => a.driveId));
    const drivesData = drives
        .filter((d) => {
            if (!userGradYear) return true; // Show if user grad year unknown
            const from = d.batchYear ? parseInt(d.batchYear) : null;
            const to = d.batchYearTo ? parseInt(d.batchYearTo) : from; // Default to 'from' if 'to' is missing
            if (from && to) return userGradYear >= from && userGradYear <= to;
            if (from) return userGradYear === from;
            return true; // Show if drive has no batch requirements
        })
        .map((d) => ({
            id: d.id,
            company: d.company,
            role: d.role,
            location: d.location || undefined,
            driveDate: d.driveDate.toISOString(),
            status: d.status,
            eligibility: d.eligibility || undefined,
            companyLogo: d.companyLogo || undefined,
            hasApplied: appliedIds.has(d.id),
            applicantCount: d._count.applications,
            batchYear: d.batchYear || undefined,
            batchYearTo: d.batchYearTo || undefined,
            registrationLink: d.registrationLink || undefined,
        }));

    return (
        <div className="p-8">
            <div className="mb-6 flex items-center gap-3">
                <Link href="/placement" className="rounded-lg p-2 hover:bg-gray-800 transition-colors">
                    <ArrowLeft className="h-5 w-5 text-gray-400" />
                </Link>
                <h1 className="text-2xl font-bold text-white">Opportunities</h1>
            </div>
            <RecruitmentDrivesSection drives={drivesData} />
        </div>
    );
}
