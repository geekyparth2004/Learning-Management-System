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
        select: { organizationId: true },
    });

    if (!user?.organizationId) redirect("/jobs");

    const [drives, userApps] = await Promise.all([
        db.recruitmentDrive.findMany({
            where: { organizationId: user.organizationId },
            orderBy: { driveDate: "desc" },
            include: { _count: { select: { applications: true } } },
        }),
        db.placementApplication.findMany({
            where: { userId: session.user.id },
            select: { driveId: true },
        }),
    ]);

    const appliedIds = new Set(userApps.map((a) => a.driveId));
    const drivesData = drives.map((d) => ({
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
