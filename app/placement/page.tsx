import React from "react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Bell, Settings, Search } from "lucide-react";
import WelcomeCard from "@/components/placement/WelcomeCard";
import RecruitmentDrivesSection from "@/components/placement/RecruitmentDrivesSection";
import ActiveTracking from "@/components/placement/ActiveTracking";
import ApplicationHistoryTable from "@/components/placement/ApplicationHistoryTable";
import ActiveGroupsList from "@/components/placement/ActiveGroupsList";

export const dynamic = "force-dynamic";

export default async function PlacementPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const userId = session.user.id;

    // Fetch all data in parallel
    const [user, profile, drives, applications, groups] = await Promise.all([
        db.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                image: true,
                organizationId: true,
                organization: { select: { name: true, domain: true } },
            },
        }),
        db.placementProfile.findUnique({
            where: { userId },
        }),
        db.recruitmentDrive.findMany({
            where: {
                organization: {
                    users: { some: { id: userId } },
                },
            },
            orderBy: { driveDate: "desc" },
            include: {
                _count: { select: { applications: true } },
            },
        }),
        db.placementApplication.findMany({
            where: { userId },
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
        }),
        db.placementGroup.findMany({
            where: {
                organization: {
                    users: { some: { id: userId } },
                },
            },
            include: {
                _count: { select: { members: true } },
                members: {
                    where: { userId },
                    select: { id: true },
                },
            },
            orderBy: { createdAt: "desc" },
        }),
    ]);

    if (!user?.organizationId || !user.organization) {
        redirect("/jobs");
    }

    // Process drives data
    const appliedDriveIds = new Set(applications.map((a) => a.driveId));
    const drivesData = drives.map((drive) => ({
        id: drive.id,
        company: drive.company,
        role: drive.role,
        location: drive.location || undefined,
        driveDate: drive.driveDate.toISOString(),
        status: drive.status,
        eligibility: drive.eligibility || undefined,
        companyLogo: drive.companyLogo || undefined,
        hasApplied: appliedDriveIds.has(drive.id),
        applicantCount: drive._count.applications,
    }));

    // Process applications data
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

    // Process groups data
    const groupsData = groups.map((group) => ({
        id: group.id,
        name: group.name,
        description: group.description || undefined,
        icon: group.icon || undefined,
        color: group.color || undefined,
        memberCount: group._count.members,
        isMember: group.members.length > 0,
    }));

    return (
        <div className="min-h-screen">
            {/* Top Bar */}
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-[#0e0e0e]/80 px-8 py-4 backdrop-blur-md">
                {/* Search */}
                <div className="relative max-w-md flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search for companies, roles, or groups..."
                        className="w-full rounded-xl border border-gray-800 bg-[#111] py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:border-teal-500/50 focus:outline-none transition-colors"
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <button className="relative rounded-lg border border-gray-800 bg-[#111] p-2.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white">
                        <Bell className="h-4 w-4" />
                        <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-teal-500 text-[8px] font-bold text-white">
                            3
                        </span>
                    </button>
                    <button className="rounded-lg border border-gray-800 bg-[#111] p-2.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white">
                        <Settings className="h-4 w-4" />
                    </button>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-sm font-bold text-white">
                        {user.name?.charAt(0)?.toUpperCase() || "S"}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2/3 — Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Welcome Profile Card */}
                        <WelcomeCard
                            userName={user.name || "Student"}
                            degree={profile?.degree || undefined}
                            department={profile?.department || undefined}
                            cgpa={profile?.cgpa || undefined}
                            batch={profile?.batch || undefined}
                            applicationCount={applications.length}
                            resumeName={profile?.resumeName || undefined}
                        />

                        {/* Recruitment Drives */}
                        <RecruitmentDrivesSection drives={drivesData} />

                        {/* Bottom Row: Active Tracking + History */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ActiveTracking applications={applicationsData} />
                            <ApplicationHistoryTable applications={applicationsData} />
                        </div>
                    </div>

                    {/* Right 1/3 — Sidebar Content */}
                    <div className="space-y-6">
                        <ActiveGroupsList groups={groupsData} />

                        {/* Placement Stats Summary */}
                        <div className="rounded-2xl border border-gray-800 bg-[#111] p-5">
                            <h3 className="mb-4 text-sm font-bold text-white">Placement Stats</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">Total Drives</span>
                                    <span className="text-sm font-semibold text-white">{drives.length}</span>
                                </div>
                                <div className="h-px bg-gray-800" />
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">Your Applications</span>
                                    <span className="text-sm font-semibold text-white">{applications.length}</span>
                                </div>
                                <div className="h-px bg-gray-800" />
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">Shortlisted</span>
                                    <span className="text-sm font-semibold text-green-400">
                                        {applications.filter((a) => a.status === "SHORTLISTED").length}
                                    </span>
                                </div>
                                <div className="h-px bg-gray-800" />
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">Placed</span>
                                    <span className="text-sm font-semibold text-emerald-400">
                                        {applications.filter((a) => a.status === "PLACED").length}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
