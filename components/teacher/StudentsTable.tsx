"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Users } from "lucide-react";

interface StudentRow {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    image: string | null;
    subscriptionStatus: string | null;
    trialExpiresAt: string | null;
}

export default function StudentsTable() {
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const limit = 10;

    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const [search, setSearch] = useState("");

    const params = useMemo(() => {
        const sp = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString()
        });
        if (search.trim()) sp.set("search", search.trim());
        return sp;
    }, [page, search]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/teacher/students?${params.toString()}`);
            if (!res.ok) return;
            const data = await res.json();
            setStudents(data.students || []);
            setTotal(data.total || 0);
            setTotalPages(data.totalPages || 1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params]);

    const start = total === 0 ? 0 : (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);

    const getInitials = (student: StudentRow) => {
        const display = student.name || student.email || "Unknown";
        const parts = display.split(" ").filter(Boolean);
        const initials = parts.map((p) => p[0]).join("").slice(0, 2);
        return initials ? initials.toUpperCase() : "U";
    };

    return (
        <div className="rounded-xl border border-gray-800 bg-[#161616] p-4">
            {/* Filters */}
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="w-full md:w-80 rounded-lg border border-gray-800 bg-[#111111] py-2 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:border-blue-600 focus:outline-none"
                    />
                </div>

                <div className="text-sm text-gray-400">
                    {loading ? "Loading..." : `${start} - ${end} of ${total} students`}
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center py-10 text-gray-400">
                    Loading...
                </div>
            ) : students.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-gray-800 bg-[#111111] py-12 text-center">
                    <Users size={44} className="mb-3 text-gray-600" />
                    <p className="text-gray-400 text-sm">{search.trim() ? "No students found." : "No students yet."}</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-800 bg-[#111111]">
                    <table className="min-w-full text-left text-sm">
                        <thead className="border-b border-gray-800 text-xs uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Student</th>
                                <th className="px-4 py-3 font-semibold">Email</th>
                                <th className="px-4 py-3 font-semibold">Phone</th>
                                <th className="px-4 py-3 font-semibold">Access</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {students.map((s) => {
                                const initials = getInitials(s);
                                const accessLabel = (() => {
                                    if (s.subscriptionStatus === "TRIAL") {
                                        if (s.trialExpiresAt) {
                                            const d = new Date(s.trialExpiresAt);
                                            if (!Number.isNaN(d.getTime())) {
                                                return `Trial ends ${d.toLocaleDateString()}`;
                                            }
                                        }
                                        return "Trial (end unknown)";
                                    }
                                    if (s.subscriptionStatus === "PAID") return "Paid";
                                    if (s.subscriptionStatus === "FREE") return "Free";
                                    return "Unknown";
                                })();
                                return (
                                    <tr key={s.id} className="hover:bg-gray-900/30 transition-colors">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                {s.image ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={s.image}
                                                        alt={s.name || s.email}
                                                        className="h-9 w-9 rounded-full"
                                                    />
                                                ) : (
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-900/30 text-sm font-bold text-blue-300">
                                                        {initials}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <div className="truncate font-semibold">{s.name || "Unknown"}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-gray-400">
                                            {s.email}
                                        </td>
                                        <td className="px-4 py-4 text-gray-400">
                                            {s.phone || "—"}
                                        </td>
                                        <td className="px-4 py-4 text-gray-400">
                                            {accessLabel}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between border-t border-gray-800 pt-4">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="flex items-center gap-2 rounded-lg border border-gray-800 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-900/40 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={16} />
                        Previous
                    </button>

                    <div className="text-sm text-gray-400">
                        Page {page} of {totalPages}
                    </div>

                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="flex items-center gap-2 rounded-lg border border-gray-800 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-900/40 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Next
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}

