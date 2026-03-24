"use client";

import React, { useState, useEffect } from "react";
import { Search, Download, FileText, Users, Building2, Percent, TrendingUp, MoreVertical } from "lucide-react";

interface Stats {
    totalApplications: number;
    placedStudents: number;
    totalStudents: number;
    activeOpportunities: number;
}

export default function ReportsPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        fetch("/api/coordinator/stats")
            .then((res) => res.json())
            .then((data) => setStats(data.stats));
    }, []);

    const tabs = [
        { key: "overview", label: "Overview" },
        { key: "departmental", label: "Departmental Performance" },
        { key: "company", label: "Company Insights" },
        { key: "history", label: "Student History" },
    ];

    const placed = stats?.placedStudents || 0;
    const total = stats?.totalStudents || 1;
    const selectionRate = total > 0 ? ((placed / total) * 100).toFixed(1) : "0";
    const recruiters = stats?.activeOpportunities || 0;

    // Sample trend data for the bar chart
    const trendYears = ["2019", "2020", "2021", "2022", "2023"];
    const trendValues = [45, 62, 55, 78, 92];
    const maxTrend = Math.max(...trendValues);

    // Department data
    const departments = [
        { name: "Computer Science", rate: 94 },
        { name: "Electronics & Comm.", rate: 88 },
        { name: "Mechanical", rate: 76 },
        { name: "Civil Engineering", rate: 65 },
    ];

    // Top companies
    const companies = [
        { name: "Google", sector: "Technology", selections: 42, salary: "$32.0 LPA", status: "Active" },
        { name: "Microsoft", sector: "Technology", selections: 38, salary: "$28.5 LPA", status: "Active" },
        { name: "Goldman Sachs", sector: "Finance", selections: 25, salary: "$22.0 LPA", status: "Closed" },
        { name: "Amazon", sector: "Technology/E-com", selections: 56, salary: "$24.0 LPA", status: "Active" },
    ];

    const companyColors = ["bg-orange-500", "bg-blue-500", "bg-green-600", "bg-yellow-500"];

    return (
        <div className="min-h-screen">
            {/* Top Bar */}
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                        <FileText className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-lg font-bold text-gray-900">Placement Reports</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search student or company..."
                            className="w-56 rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                        />
                    </div>
                </div>
            </header>

            <main className="p-8">
                {/* Page Header */}
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Placement Analytics</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Comprehensive data on student recruitment, industry trends, and selection performance.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                            <Download className="h-4 w-4" />
                            Download CSV
                        </button>
                        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
                            <FileText className="h-4 w-4" />
                            Export PDF Report
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6 flex items-center gap-6 border-b border-gray-200 pb-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`pb-3 text-sm font-medium transition-colors ${
                                activeTab === tab.key
                                    ? "text-blue-600 border-b-2 border-blue-600"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Stats Cards */}
                <div className="mb-6 grid grid-cols-4 gap-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <span className="flex items-center gap-0.5 text-xs font-semibold text-green-600">
                                +12%
                                <TrendingUp className="h-3 w-3" />
                            </span>
                        </div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Total Placed</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">
                            {placed}
                            <span className="ml-1 text-sm font-normal text-gray-400">/ {total}</span>
                        </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                            </div>
                            <span className="flex items-center gap-0.5 text-xs font-semibold text-green-600">
                                +8%
                                <TrendingUp className="h-3 w-3" />
                            </span>
                        </div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Avg. Package</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">$12.4 LPA</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50">
                                <Building2 className="h-5 w-5 text-gray-600" />
                            </div>
                            <span className="text-xs font-semibold text-gray-400">Stable</span>
                        </div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Recruiters</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">
                            {recruiters}
                            <span className="ml-1.5 text-sm font-normal text-gray-400">Companies</span>
                        </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50">
                                <Percent className="h-5 w-5 text-gray-600" />
                            </div>
                            <span className="flex items-center gap-0.5 text-xs font-semibold text-red-500">
                                -2%
                                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M7 7l10 10M17 7v10H7"/></svg>
                            </span>
                        </div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Selection Rate</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">{selectionRate}%</p>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="mb-6 grid grid-cols-2 gap-4">
                    {/* Placement Trends Bar Chart */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-base font-bold text-gray-900">Placement Trends (5 Years)</h3>
                            <button className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
                                <MoreVertical className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex items-end justify-between gap-3 h-44">
                            {trendYears.map((year, i) => (
                                <div key={year} className="flex flex-1 flex-col items-center gap-2">
                                    <div className="w-full flex items-end justify-center" style={{ height: "140px" }}>
                                        <div
                                            className="w-10 rounded-t-md bg-blue-500 transition-all"
                                            style={{ height: `${(trendValues[i] / maxTrend) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-500">{year}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Selection Rate by Department */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-base font-bold text-gray-900">Selection Rate by Department</h3>
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                                    Placed
                                </span>
                                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <span className="h-2 w-2 rounded-full bg-gray-200" />
                                    Unplaced
                                </span>
                            </div>
                        </div>
                        <div className="space-y-5">
                            {departments.map((dept) => (
                                <div key={dept.name}>
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <span className="text-sm text-gray-700">{dept.name}</span>
                                        <span className="text-sm font-semibold text-gray-900">{dept.rate}%</span>
                                    </div>
                                    <div className="h-2.5 w-full rounded-full bg-gray-100">
                                        <div
                                            className="h-full rounded-full bg-blue-500 transition-all"
                                            style={{ width: `${dept.rate}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Recruiting Companies */}
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <div className="mb-5 flex items-center justify-between">
                        <h3 className="text-base font-bold text-gray-900">Top Recruiting Companies</h3>
                        <div className="flex items-center gap-3">
                            <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                                All Sectors
                            </button>
                            <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                                View All Companies
                            </button>
                        </div>
                    </div>
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Company</th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Sector</th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Selections</th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Avg. Salary</th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {companies.map((company, i) => (
                                <tr key={company.name} className="hover:bg-gray-50/50">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${companyColors[i]} text-xs font-bold text-white`}>
                                                {company.name.charAt(0)}
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">{company.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-600">{company.sector}</td>
                                    <td className="px-4 py-4 text-sm font-semibold text-gray-900">{company.selections}</td>
                                    <td className="px-4 py-4 text-sm text-gray-600">{company.salary}</td>
                                    <td className="px-4 py-4">
                                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                            company.status === "Active"
                                                ? "bg-green-50 text-green-600"
                                                : "bg-gray-100 text-gray-500"
                                        }`}>
                                            {company.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-4 text-xs text-gray-400">
                    <p>© 2024 Educational Institution Placement Cell. All rights reserved.</p>
                    <div className="flex items-center gap-4">
                        <span>Privacy Policy</span>
                        <span>Audit Logs</span>
                        <span>Last Updated: {new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}</span>
                    </div>
                </div>
            </main>
        </div>
    );
}
