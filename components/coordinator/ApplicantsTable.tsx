"use client";

import React, { useEffect, useState } from "react";
import { Download, ChevronLeft, ChevronRight, MoreVertical, Loader2, Upload } from "lucide-react";

interface Applicant {
    id: string;
    status: string;
    appliedAt: string;
    user: {
        id: string;
        name: string;
        email: string;
        placementProfile?: {
            cgpa?: number;
            skills?: string;
            department?: string;
            batch?: string;
        };
    };
}

interface ApplicantsTableProps {
    driveId: string;
    driveName: string;
    driveStatus: string;
    totalApplicants: number;
}

export default function ApplicantsTable({ driveId, driveName, driveStatus, totalApplicants }: ApplicantsTableProps) {
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
    const [updateEmail, setUpdateEmail] = useState("");
    const [updateStatus, setUpdateStatus] = useState("SHORTLISTED");
    const [updating, setUpdating] = useState(false);
    const [showUpdatePanel, setShowUpdatePanel] = useState(false);

    const fetchApplicants = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "10",
                ...(statusFilter !== "ALL" && { status: statusFilter }),
            });
            const res = await fetch(`/api/coordinator/drives/${driveId}/applicants?${params}`);
            const data = await res.json();
            setApplicants(data.applicants || []);
            setTotalPages(data.totalPages || 1);
            setStatusCounts(data.statusCounts || {});
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplicants();
    }, [page, statusFilter]);

    const handleStatusUpdate = async () => {
        if (!updateEmail) return;
        setUpdating(true);
        try {
            await fetch(`/api/coordinator/drives/${driveId}/applicants/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: updateEmail, status: updateStatus }),
            });
            setUpdateEmail("");
            fetchApplicants();
        } catch {
            // silent
        } finally {
            setUpdating(false);
        }
    };

    const statusTabs = ["ALL", "APPLIED", "SHORTLISTED", "REJECTED", "PLACED"];

    const statusStyles: Record<string, string> = {
        APPLIED: "bg-blue-50 text-blue-600",
        SHORTLISTED: "bg-green-50 text-green-600",
        INTERVIEW: "bg-orange-50 text-orange-600",
        PLACED: "bg-emerald-50 text-emerald-600",
        REJECTED: "bg-red-50 text-red-600",
        WITHDRAWN: "bg-gray-100 text-gray-500",
        PENDING: "bg-yellow-50 text-yellow-600",
    };

    return (
        <div>
            {/* Drive Header */}
            <div className="mb-6 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-6">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-gray-900">{driveName}</h2>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                            driveStatus === "COMPLETED" ? "bg-gray-100 text-gray-500" : "bg-green-50 text-green-600"
                        }`}>
                            {driveStatus === "COMPLETED" ? "CLOSED" : "ACTIVE"}
                        </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                        Reviewing {totalApplicants} applications
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                        <Download className="h-4 w-4" />
                        Export CSV
                    </button>
                    <button
                        onClick={() => setShowUpdatePanel(!showUpdatePanel)}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                    >
                        Update Status
                    </button>
                </div>
            </div>

            {/* Update Status Panel */}
            {showUpdatePanel && (
                <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
                    <h3 className="mb-4 text-base font-bold text-gray-900">Update Application Status</h3>
                    <div className="grid grid-cols-2 gap-6">
                        {/* Manual Update */}
                        <div>
                            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Manual Update</p>
                            <div className="flex items-end gap-3">
                                <div className="flex-1 space-y-1">
                                    <label className="text-xs text-gray-500">Student Email</label>
                                    <input
                                        type="email"
                                        value={updateEmail}
                                        onChange={(e) => setUpdateEmail(e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white focus:outline-none"
                                        placeholder="e.g. alex.chen@example.edu"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500">Select Status</label>
                                    <select
                                        value={updateStatus}
                                        onChange={(e) => setUpdateStatus(e.target.value)}
                                        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white focus:outline-none"
                                    >
                                        <option value="APPLIED">Applied</option>
                                        <option value="SHORTLISTED">Shortlisted</option>
                                        <option value="INTERVIEW">Interview</option>
                                        <option value="PLACED">Placed</option>
                                        <option value="REJECTED">Rejected</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        {/* Bulk Upload */}
                        <div>
                            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Bulk Update</p>
                            <div className="flex items-end gap-3">
                                <div className="flex-1 space-y-1">
                                    <label className="text-xs text-gray-500">Upload Excel File</label>
                                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400 hover:bg-gray-100">
                                        <Upload className="h-4 w-4" />
                                        Choose file...
                                        <input type="file" className="hidden" accept=".xlsx,.csv" />
                                    </label>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500">Target Status</label>
                                    <select className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white focus:outline-none">
                                        <option>Pending</option>
                                        <option>Shortlisted</option>
                                        <option>Rejected</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleStatusUpdate}
                            disabled={updating || !updateEmail}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {updating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            Update Status
                        </button>
                    </div>
                </div>
            )}

            {/* Filter Tabs */}
            <div className="mb-4 flex items-center gap-2">
                {statusTabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => { setStatusFilter(tab); setPage(1); }}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                            statusFilter === tab
                                ? "bg-blue-600 text-white"
                                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                        {tab === "ALL" ? "All Applicants" : tab.charAt(0) + tab.slice(1).toLowerCase()}
                        {statusCounts[tab] !== undefined && (
                            <span className="ml-1.5 text-[10px] opacity-80">{statusCounts[tab]}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                            <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Student Name</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Email ID</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">CGPA</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Skills</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Applied Date</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Status</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="py-12 text-center text-sm text-gray-400">Loading...</td>
                            </tr>
                        ) : applicants.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-12 text-center text-sm text-gray-400">No applicants found.</td>
                            </tr>
                        ) : (
                            applicants.map((app) => {
                                const initials = app.user.name
                                    ? app.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                                    : "??";
                                const skills = app.user.placementProfile?.skills?.split(",").map((s) => s.trim()).filter(Boolean) || [];

                                return (
                                    <tr key={app.id} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                                                    {initials}
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">{app.user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-500">{app.user.email}</td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm font-semibold text-blue-600">
                                                {app.user.placementProfile?.cgpa?.toFixed(2) || "—"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {skills.slice(0, 2).map((skill) => (
                                                    <span key={skill} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                                                        {skill}
                                                    </span>
                                                ))}
                                                {skills.length > 2 && (
                                                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
                                                        +{skills.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-500">
                                            {new Date(app.appliedAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${statusStyles[app.status] || "bg-gray-100 text-gray-500"}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <button className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                                                <MoreVertical className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
                        <p className="text-xs text-gray-500">
                            Page {page} of {totalPages}
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page === 1}
                                className="rounded-md border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50 disabled:opacity-30"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                                        page === p ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                            <button
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                disabled={page === totalPages}
                                className="rounded-md border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50 disabled:opacity-30"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
