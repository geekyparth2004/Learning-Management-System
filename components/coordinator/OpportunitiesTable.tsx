"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Edit, Eye, Bell, Trash2 } from "lucide-react";

interface Drive {
    id: string;
    company: string;
    role: string;
    type: string;
    status: string;
    location?: string;
    _count: { applications: number };
}

export default function OpportunitiesTable() {
    const [drives, setDrives] = useState<Drive[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");

    useEffect(() => {
        fetch("/api/coordinator/drives")
            .then((res) => res.json())
            .then((data) => {
                setDrives(data.drives || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this opportunity? The associated group will also be deleted.")) return;
        
        try {
            const res = await fetch(`/api/coordinator/drives/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setDrives(prev => prev.filter(d => d.id !== id));
            }
        } catch (error) {
            console.error("Failed to delete drive", error);
        }
    };

    const tabs = ["ALL", "ON_CAMPUS", "OFF_CAMPUS"];
    const filtered = filter === "ALL" ? drives : drives.filter((d) => d.type === filter);

    if (loading) {
        return <div className="flex items-center justify-center py-16 text-gray-400">Loading...</div>;
    }

    const activeCount = drives.filter((d) => d.status !== "COMPLETED").length;
    const totalApps = drives.reduce((sum, d) => sum + d._count.applications, 0);
    const avgApps = drives.length > 0 ? Math.round(totalApps / drives.length) : 0;

    return (
        <div>
            {/* Table */}
            <div className="rounded-xl border border-gray-200 bg-white">
                {/* Header tabs */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <div className="flex items-center gap-6">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setFilter(tab)}
                                className={`text-sm font-medium pb-0.5 transition-colors ${
                                    filter === tab
                                        ? "text-blue-600 border-b-2 border-blue-600"
                                        : "text-gray-500 hover:text-gray-700"
                                }`}
                            >
                                {tab === "ALL"
                                    ? `All (${drives.length})`
                                    : tab === "ON_CAMPUS"
                                    ? "On-Campus"
                                    : "Off-Campus"}
                            </button>
                        ))}
                    </div>
                    <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                        Filter
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                    Job Details
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                    Type
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                    Applications
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map((drive) => (
                                <tr key={drive.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-600">
                                                {drive.company.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{drive.role}</p>
                                                <p className="text-xs text-gray-500">
                                                    {drive.company}{drive.location ? ` \u2022 ${drive.location}` : ""}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                            drive.type === "ON_CAMPUS"
                                                ? "bg-blue-50 text-blue-600"
                                                : "bg-gray-100 text-gray-600"
                                        }`}>
                                            {drive.type === "ON_CAMPUS" ? "On-Campus" : "Off-Campus"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-gray-900">
                                                {drive._count.applications}
                                            </span>
                                            <div className="h-1.5 w-16 rounded-full bg-gray-100">
                                                <div
                                                    className="h-full rounded-full bg-blue-500"
                                                    style={{
                                                        width: `${Math.min((drive._count.applications / 300) * 100, 100)}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                                            drive.status === "COMPLETED"
                                                ? "text-gray-500"
                                                : "text-green-600"
                                        }`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${
                                                drive.status === "COMPLETED" ? "bg-gray-400" : "bg-green-500"
                                            }`} />
                                            {drive.status === "COMPLETED" ? "Closed" : "Active"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={`/coordinator/opportunities/${drive.id}`}
                                                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                            <button className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                                                <Bell className="h-4 w-4" />
                                            </button>
                                            <Link
                                                href={`/coordinator/opportunities/${drive.id}`}
                                                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                            <button 
                                                onClick={() => handleDelete(drive.id)}
                                                className="rounded-md p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"
                                                title="Delete Opportunity"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filtered.length === 0 && (
                    <div className="py-12 text-center text-sm text-gray-400">
                        No opportunities found.
                    </div>
                )}
            </div>

            {/* Bottom Stats */}
            <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <p className="text-xs font-medium text-gray-500">Active Postings</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{activeCount}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <p className="text-xs font-medium text-gray-500">Total Applications</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                        {totalApps}
                        <span className="ml-2 text-xs font-normal text-gray-400">Avg. {avgApps} per post</span>
                    </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <p className="text-xs font-medium text-gray-500">Conversion Rate</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                        {totalApps > 0 ? ((drives.filter((d) => d.status === "COMPLETED").length / drives.length * 100) || 0).toFixed(1) : "0"}%
                    </p>
                </div>
            </div>
        </div>
    );
}
