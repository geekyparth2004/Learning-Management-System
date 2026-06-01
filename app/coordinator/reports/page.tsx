"use client";

import React, { useState, useEffect } from "react";
import { Search, Download, FileText, Users, Building2, Percent, TrendingUp, TrendingDown, MoreVertical, Loader2 } from "lucide-react";

interface Overview {
    totalStudents: number;
    placedStudents: number;
    totalApplications: number;
    selectionRate: number;
    recruiters: number;
    activeDrives: number;
}

interface Department {
    name: string;
    total: number;
    placed: number;
    rate: number;
}

interface Company {
    name: string;
    totalApplications: number;
    selections: number;
    shortlisted: number;
    rejected: number;
    status: string;
}

interface StudentHistoryItem {
    id: string;
    studentName: string;
    studentEmail: string;
    department: string;
    batch: string;
    company: string;
    role: string;
    status: string;
    appliedAt: string;
    updatedAt: string;
}

interface ReportsData {
    overview: Overview;
    departments: Department[];
    companies: Company[];
    trends: {
        years: string[];
        values: number[];
    };
    studentHistory: StudentHistoryItem[];
}

export default function ReportsPage() {
    const [data, setData] = useState<ReportsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        fetch("/api/coordinator/reports")
            .then((res) => res.json())
            .then((d) => setData(d))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const tabs = [
        { key: "overview", label: "Overview" },
        { key: "departmental", label: "Departmental Performance" },
        { key: "company", label: "Company Insights" },
        { key: "history", label: "Student History" },
    ];

    const statusStyles: Record<string, string> = {
        APPLIED: "bg-blue-50 text-blue-600",
        SHORTLISTED: "bg-green-50 text-green-600",
        INTERVIEW: "bg-orange-50 text-orange-600",
        PLACED: "bg-emerald-50 text-emerald-600",
        REJECTED: "bg-red-50 text-red-600",
        WITHDRAWN: "bg-gray-100 text-gray-500",
    };

    // CSV download helper
    const downloadCSV = () => {
        if (!data) return;

        let csv = "";
        if (activeTab === "overview" || activeTab === "departmental") {
            csv = "Department,Total Students,Placed,Selection Rate (%)\n";
            data.departments.forEach((d) => {
                csv += `"${d.name}",${d.total},${d.placed},${d.rate}\n`;
            });
        } else if (activeTab === "company") {
            csv = "Company,Total Applications,Selections,Shortlisted,Rejected,Status\n";
            data.companies.forEach((c) => {
                csv += `"${c.name}",${c.totalApplications},${c.selections},${c.shortlisted},${c.rejected},${c.status}\n`;
            });
        } else if (activeTab === "history") {
            csv = "Student,Email,Department,Batch,Company,Role,Status,Applied Date\n";
            data.studentHistory.forEach((h) => {
                csv += `"${h.studentName}","${h.studentEmail}","${h.department}","${h.batch}","${h.company}","${h.role}","${h.status}","${new Date(h.appliedAt).toLocaleDateString()}"\n`;
            });
        }

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `placement_report_${activeTab}_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // PDF export (generates a printable page)
    const exportPDF = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const overview = data?.overview;
    const placed = overview?.placedStudents || 0;
    const total = overview?.totalStudents || 0;
    const selectionRate = overview?.selectionRate || 0;
    const recruiters = overview?.recruiters || 0;

    const trendYears = data?.trends?.years || [];
    const trendValues = data?.trends?.values || [];
    const maxTrend = trendValues.length > 0 ? Math.max(...trendValues, 1) : 1;

    const departments = data?.departments || [];
    const companies = data?.companies || [];
    const studentHistory = data?.studentHistory || [];

    const companyColors = ["bg-orange-500", "bg-blue-500", "bg-green-600", "bg-yellow-500", "bg-purple-500", "bg-pink-500", "bg-teal-500", "bg-red-500"];

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
                    <div className="flex items-center gap-3 print:hidden">
                        <button
                            onClick={downloadCSV}
                            className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                        >
                            <Download className="h-4 w-4" />
                            Download CSV
                        </button>
                        <button
                            onClick={exportPDF}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                        >
                            <FileText className="h-4 w-4" />
                            Export PDF Report
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6 flex items-center gap-6 border-b border-gray-200 pb-0 print:hidden">
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

                {/* ========= OVERVIEW TAB ========= */}
                {(activeTab === "overview" || activeTab === "departmental") && (
                    <>
                        {/* Stats Cards */}
                        <div className="mb-6 grid grid-cols-4 gap-4">
                            <div className="rounded-xl border border-gray-200 bg-white p-5">
                                <div className="mb-3 flex items-center justify-between">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                                        <Users className="h-5 w-5 text-blue-600" />
                                    </div>
                                    {placed > 0 && (
                                        <span className="flex items-center gap-0.5 text-xs font-semibold text-green-600">
                                            <TrendingUp className="h-3 w-3" />
                                        </span>
                                    )}
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
                                </div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Total Applications</p>
                                <p className="mt-1 text-2xl font-bold text-gray-900">{overview?.totalApplications || 0}</p>
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-white p-5">
                                <div className="mb-3 flex items-center justify-between">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50">
                                        <Building2 className="h-5 w-5 text-gray-600" />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-400">
                                        {overview?.activeDrives || 0} Active
                                    </span>
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
                                    {selectionRate > 0 ? (
                                        <span className="flex items-center gap-0.5 text-xs font-semibold text-green-600">
                                            <TrendingUp className="h-3 w-3" />
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-0.5 text-xs font-semibold text-gray-400">
                                            —
                                        </span>
                                    )}
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
                                    <h3 className="text-base font-bold text-gray-900">
                                        Placement Trends {trendYears.length > 0 ? `(${trendYears[0]}–${trendYears[trendYears.length - 1]})` : ""}
                                    </h3>
                                </div>
                                {trendYears.length === 0 ? (
                                    <div className="flex h-44 items-center justify-center text-sm text-gray-400">
                                        No placement data yet.
                                    </div>
                                ) : (
                                    <div className="flex items-end justify-between gap-3 h-44">
                                        {trendYears.map((year, i) => (
                                            <div key={year} className="flex flex-1 flex-col items-center gap-2">
                                                <div className="w-full flex items-end justify-center" style={{ height: "120px" }}>
                                                    <div className="relative w-10 group">
                                                        <div
                                                            className="w-full rounded-t-md bg-blue-500 transition-all hover:bg-blue-600"
                                                            style={{ height: `${(trendValues[i] / maxTrend) * 100}%`, minHeight: trendValues[i] > 0 ? "4px" : "0" }}
                                                        />
                                                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                            {trendValues[i]} placed
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-gray-500">{year}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                                {departments.length === 0 ? (
                                    <div className="flex h-32 items-center justify-center text-sm text-gray-400">
                                        No department data available.
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        {departments.slice(0, 6).map((dept) => (
                                            <div key={dept.name}>
                                                <div className="mb-1.5 flex items-center justify-between">
                                                    <span className="text-sm text-gray-700">{dept.name}</span>
                                                    <span className="text-sm font-semibold text-gray-900">
                                                        {dept.rate}%
                                                        <span className="ml-1 text-xs font-normal text-gray-400">
                                                            ({dept.placed}/{dept.total})
                                                        </span>
                                                    </span>
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
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* ========= COMPANY INSIGHTS TAB ========= */}
                {(activeTab === "overview" || activeTab === "company") && (
                    <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
                        <div className="mb-5 flex items-center justify-between">
                            <h3 className="text-base font-bold text-gray-900">
                                {activeTab === "company" ? "All Companies" : "Top Recruiting Companies"}
                            </h3>
                        </div>
                        {companies.length === 0 ? (
                            <div className="py-12 text-center text-sm text-gray-400">
                                No company data available yet. Post recruitment drives to see company insights.
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Company</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Applications</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Selections</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Shortlisted</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Rejected</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(activeTab === "company" ? companies : companies.slice(0, 5)).map((company, i) => (
                                        <tr key={company.name} className="hover:bg-gray-50/50">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${companyColors[i % companyColors.length]} text-xs font-bold text-white`}>
                                                        {company.name.charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900">{company.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-sm font-semibold text-gray-900">{company.totalApplications}</td>
                                            <td className="px-4 py-4">
                                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                                                    {company.selections}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
                                                    {company.shortlisted}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-500">
                                                    {company.rejected}
                                                </span>
                                            </td>
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
                        )}
                    </div>
                )}

                {/* ========= STUDENT HISTORY TAB ========= */}
                {activeTab === "history" && (
                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                        <div className="mb-5 flex items-center justify-between">
                            <h3 className="text-base font-bold text-gray-900">Student Application History</h3>
                            <span className="text-xs text-gray-400">{studentHistory.length} records</span>
                        </div>
                        {studentHistory.length === 0 ? (
                            <div className="py-12 text-center text-sm text-gray-400">
                                No student application history yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Student</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Department</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Company</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Role</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Status</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Applied</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {studentHistory.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50/50">
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{item.studentName}</p>
                                                        <p className="text-[10px] text-gray-400">{item.studentEmail}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item.department}</td>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.company}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item.role}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusStyles[item.status] || "bg-gray-100 text-gray-500"}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500">
                                                    {new Date(item.appliedAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-4 text-xs text-gray-400 print:hidden">
                    <p>© {new Date().getFullYear()} Placement Cell. All rights reserved.</p>
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
