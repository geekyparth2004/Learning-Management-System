"use client";

import React, { useEffect, useState } from "react";
import { Download, ChevronLeft, ChevronRight, Search, SlidersHorizontal, ArrowRight, BarChart3, TrendingUp, CheckCircle } from "lucide-react";

interface Student {
    id: string;
    name: string;
    email: string;
    image?: string;
    placementProfile?: {
        cgpa?: number;
        batch?: string;
        department?: string;
        degree?: string;
        fatherName?: string;
        ugPercentage?: number;
        pgPercentage?: number;
        skills?: string;
    };
    _count: { placementApplications: number };
}

export default function StudentsTable() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [batchFilter, setBatchFilter] = useState("");
    const [skillsFilter, setSkillsFilter] = useState("");
    const [cgpaMin, setCgpaMin] = useState("");
    const [cgpaMax, setCgpaMax] = useState("");

    const fetchStudents = async () => {
        setLoading(true);
        const params = new URLSearchParams({
            page: page.toString(),
            limit: "5",
            ...(search && { search }),
            ...(batchFilter && { batch: batchFilter }),
            ...(cgpaMin && { minCgpa: cgpaMin }),
        });
        try {
            const res = await fetch(`/api/coordinator/students?${params}`);
            const data = await res.json();
            setStudents(data.students || []);
            setTotal(data.total || 0);
            setTotalPages(data.totalPages || 1);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [page, search, batchFilter, cgpaMin]);

    // Compute bottom stats
    const avgCgpa = students.length > 0
        ? (students.reduce((sum, s) => sum + (s.placementProfile?.cgpa || 0), 0) / students.filter(s => s.placementProfile?.cgpa).length).toFixed(2)
        : "0.00";

    const deptCounts: Record<string, number> = {};
    students.forEach((s) => {
        const dept = s.placementProfile?.department || "Unknown";
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });
    const topMajor = Object.entries(deptCounts).sort((a, b) => b[1] - a[1])[0];

    const colorPalette = [
        "bg-blue-500", "bg-green-500", "bg-orange-500",
        "bg-purple-500", "bg-pink-500", "bg-teal-500",
    ];

    return (
        <div>
            {/* Filters Row */}
            <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5">
                <div className="grid grid-cols-4 gap-4">
                    {/* Search */}
                    <div>
                        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            Search Student
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                placeholder="Name, ID or Email"
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Batch Year */}
                    <div>
                        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            Batch Year
                        </label>
                        <select
                            value={batchFilter}
                            onChange={(e) => { setBatchFilter(e.target.value); setPage(1); }}
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm text-gray-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                        >
                            <option value="">All Batches</option>
                            <option value="2024">2024</option>
                            <option value="2025">2025</option>
                            <option value="2026">2026</option>
                            <option value="2027">2027</option>
                        </select>
                    </div>

                    {/* Skills */}
                    <div>
                        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            Skills
                        </label>
                        <select
                            value={skillsFilter}
                            onChange={(e) => setSkillsFilter(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm text-gray-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                        >
                            <option value="">All Skills</option>
                            <option value="Python">Python</option>
                            <option value="React">React</option>
                            <option value="Java">Java</option>
                            <option value="SQL">SQL</option>
                            <option value="AI">AI</option>
                        </select>
                    </div>

                    {/* CGPA Range */}
                    <div>
                        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            CGPA Range
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="10"
                                value={cgpaMin}
                                onChange={(e) => { setCgpaMin(e.target.value); setPage(1); }}
                                placeholder="0.0"
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                            />
                            <span className="text-xs text-gray-400">to</span>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="10"
                                value={cgpaMax}
                                onChange={(e) => setCgpaMax(e.target.value)}
                                placeholder="10.0"
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="px-6 py-3.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Student Name</th>
                            <th className="px-4 py-3.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Major</th>
                            <th className="px-4 py-3.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Batch</th>
                            <th className="px-4 py-3.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">CGPA</th>
                            <th className="px-4 py-3.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Skills</th>
                            <th className="px-4 py-3.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="py-16 text-center text-sm text-gray-400">Loading...</td>
                            </tr>
                        ) : students.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-16 text-center text-sm text-gray-400">No students found.</td>
                            </tr>
                        ) : (
                            students.map((student, idx) => {
                                const initials = student.name
                                    ? student.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                                    : "??";
                                const skills = student.placementProfile?.skills?.split(",").map((s) => s.trim()).filter(Boolean) || [];
                                const bgColor = colorPalette[idx % colorPalette.length];

                                return (
                                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`flex h-9 w-9 items-center justify-center rounded-full ${bgColor} text-xs font-bold text-white`}>
                                                    {initials}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{student.name}</p>
                                                    <p className="text-[11px] text-gray-400">
                                                        {student.email.split("@")[0]}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-700">
                                            {student.placementProfile?.department || "—"}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-700">
                                            {student.placementProfile?.batch?.split(" ").pop() || "—"}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                                (student.placementProfile?.cgpa || 0) >= 8
                                                    ? "bg-green-50 text-green-600"
                                                    : (student.placementProfile?.cgpa || 0) >= 6
                                                    ? "bg-blue-50 text-blue-600"
                                                    : "bg-orange-50 text-orange-600"
                                            }`}>
                                                {student.placementProfile?.cgpa?.toFixed(2) || "—"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {skills.slice(0, 2).map((skill) => (
                                                    <span key={skill} className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <button className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                                                View Profile
                                                <ArrowRight className="h-3.5 w-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
                    <p className="text-xs text-gray-500">
                        Showing {((page - 1) * 5) + 1} to {Math.min(page * 5, total)} of {total} students
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30"
                        >
                            Previous
                        </button>
                        {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                                    page === p ? "bg-blue-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                                {p}
                            </button>
                        ))}
                        <button
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                            className="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Stats Cards */}
            <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="rounded-xl border border-blue-100 bg-white p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                            <BarChart3 className="h-5 w-5 text-blue-600" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900">Class Average</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{avgCgpa}</p>
                    <p className="mt-1 text-xs text-green-600">+0.12 from last semester</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50">
                            <TrendingUp className="h-5 w-5 text-gray-600" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900">Top Major</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{topMajor ? topMajor[0].substring(0, 8) : "CS"}</p>
                    <p className="mt-1 text-xs text-gray-500">{topMajor ? `${topMajor[1]} students enrolled` : "—"}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50">
                            <CheckCircle className="h-5 w-5 text-gray-600" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900">Submission Rate</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">94%</p>
                    <p className="mt-1 text-xs text-gray-500">Current term average</p>
                </div>
            </div>
        </div>
    );
}
