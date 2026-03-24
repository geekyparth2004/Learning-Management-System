import React from "react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import ApplicationHistoryTable from "@/components/placement/ApplicationHistoryTable";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const applications = await db.placementApplication.findMany({
        where: { userId: session.user.id },
        orderBy: { appliedAt: "desc" },
        include: {
            drive: {
                select: {
                    company: true,
                    role: true,
                    location: true,
                    companyLogo: true,
                    driveDate: true,
                },
            },
        },
    });

    const applicationsData = applications.map((app) => ({
        id: app.id,
        status: app.status,
        stage: app.stage || undefined,
        stageNumber: app.stageNumber,
        totalStages: app.totalStages,
        appliedAt: app.appliedAt.toISOString(),
        drive: {
            company: app.drive.company,
            role: app.drive.role,
            companyLogo: app.drive.companyLogo || undefined,
        },
    }));

    return (
        <div className="p-8">
            <div className="mb-6 flex items-center gap-3">
                <Link href="/placement" className="rounded-lg p-2 hover:bg-gray-800 transition-colors">
                    <ArrowLeft className="h-5 w-5 text-gray-400" />
                </Link>
                <h1 className="text-2xl font-bold text-white">My Applications</h1>
            </div>
            <ApplicationHistoryTable applications={applicationsData} />
        </div>
    );
}
