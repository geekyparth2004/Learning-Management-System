"use client";

import React, { useEffect, useState } from "react";
import { Bell, Search, Plus, TrendingUp, TrendingDown } from "lucide-react";
import PostOpportunityForm from "@/components/coordinator/PostOpportunityForm";
import Link from "next/link";

interface Stats {
    activeOpportunities: number;
    studentEngagement: number;
    pendingApprovals: number;
    shortlistedStudents: number;
}

interface Drive {
    id: string;
    company: string;
    role: string;
    _count: { applications: number };
    group?: { id: string; name: string };
}

export default function CoordinatorDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [groups, setGroups] = useState<Drive[]>([]);

    useEffect(() => {
        fetch("/api/coordinator/stats")
            .then((res) => res.json())
            .then((data) => setStats(data.stats));

        fetch("/api/coordinator/drives")
            .then((res) => res.json())
            .then((data) => setGroups(data.drives?.slice(0, 4) || []));
    }, []);

    const statCards = stats
        ? [
              { label: "Active Opportunities", value: stats.activeOpportunities, change: "+5%", positive: true },
              { label: "Student Engagement", value: `${stats.studentEngagement}%`, change: "+12%", positive: true },
              { label: "Pending Approvals", value: stats.pendingApprovals, change: "-2%", positive: false },
              { label: "Shortlisted Students", value: stats.shortlistedStudents, change: "+18%", positive: true },
          ]
        : [];

    return (
        <div className="min-h-screen">
            {/* Top Bar */}
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
                <h1 className="text-lg font-bold text-gray-900">Dashboard Overview</h1>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search students or jobs..."
                            className="w-64 rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                        />
                    </div>
                    <button className="relative rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50">
                        <Bell className="h-4 w-4" />
                    </button>
                    <Link
                        href="/coordinator/opportunities"
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        New Opportunity
                    </Link>
                </div>
            </header>

            <main className="p-8">
                {/* Stats Cards */}
                <div className="mb-8 grid grid-cols-4 gap-4">
                    {statCards.map((card) => (
                        <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-5">
                            <p className="text-xs font-medium text-gray-500">{card.label}</p>
                            <div className="mt-2 flex items-end justify-between">
                                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                                <span className={`flex items-center gap-0.5 text-xs font-semibold ${
                                    card.positive ? "text-green-600" : "text-red-500"
                                }`}>
                                    {card.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                    {card.change}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content: Post Form + Groups */}
                <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2">
                        <PostOpportunityForm />
                    </div>

                    {/* Coordination Groups */}
                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-base font-bold text-gray-900">Coordination Groups</h3>
                        </div>
                        <div className="space-y-3">
                            {groups.length > 0 ? groups.map((drive) => {
                                const colors = ["bg-green-500", "bg-blue-500", "bg-orange-500", "bg-red-500", "bg-purple-500"];
                                const color = colors[drive.company.charCodeAt(0) % colors.length];
                                return (
                                    <div key={drive.id} className="flex items-start gap-3 rounded-lg p-2 hover:bg-gray-50 cursor-pointer transition-colors">
                                        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${color} text-xs font-bold text-white`}>
                                            {drive.company.charAt(0)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-gray-900">
                                                {drive.company} - {drive.role.substring(0, 15)}...
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Teachers, Students, Admin
                                            </p>
                                            <p className="mt-0.5 text-xs text-blue-500 italic">
                                                {drive._count.applications} applicants
                                            </p>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <p className="py-6 text-center text-sm text-gray-400">
                                    No groups yet. Post an opportunity to create one.
                                </p>
                            )}
                            {groups.length > 0 && (
                                <Link href="/coordinator/groups" className="block text-center text-sm font-medium text-blue-600 hover:text-blue-700 pt-2">
                                    View All Groups
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Student Activities */}
                <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-base font-bold text-gray-900">Recent Student Activities</h3>
                        <div className="flex items-center gap-2">
                            <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                                Filter
                            </button>
                            <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                                Export CSV
                            </button>
                        </div>
                    </div>
                    <div className="text-center py-8 text-sm text-gray-400">
                        Recent application activities will appear here when students start applying.
                    </div>
                </div>
            </main>
        </div>
    );
}
