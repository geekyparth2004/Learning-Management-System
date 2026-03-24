import React from "react";
import { Pencil, FileText, GraduationCap } from "lucide-react";
import Link from "next/link";

interface WelcomeCardProps {
    userName: string;
    degree?: string;
    department?: string;
    cgpa?: number;
    batch?: string;
    applicationCount: number;
    resumeName?: string;
}

export default function WelcomeCard({
    userName,
    degree,
    department,
    cgpa,
    batch,
    applicationCount,
    resumeName,
}: WelcomeCardProps) {
    return (
        <div className="rounded-2xl border border-gray-800 bg-[#111] p-6">
            {/* Welcome Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 text-xl font-bold text-white shadow-lg shadow-teal-500/20">
                        {userName?.charAt(0)?.toUpperCase() || "S"}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            Welcome back, {userName?.split(" ")[0] || "Student"}
                        </h2>
                        <p className="text-sm text-gray-400">
                            {degree || "Student"}{department ? `, ${department}` : ""}
                        </p>
                    </div>
                </div>
                <Link
                    href="/placement/profile"
                    className="flex items-center gap-2 rounded-lg border border-gray-700 bg-[#1a1a1a] px-4 py-2 text-sm text-gray-300 transition-colors hover:border-teal-500/50 hover:text-teal-400"
                >
                    <Pencil className="h-3.5 w-3.5" />
                    Update Profile
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl border border-gray-800 bg-[#0e0e0e] p-4">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                        Current CGPA
                    </p>
                    <p className="text-2xl font-bold text-white">
                        {cgpa ? `${cgpa} / 10` : "—"}
                    </p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-[#0e0e0e] p-4">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                        Batch
                    </p>
                    <p className="text-2xl font-bold text-white">
                        {batch || "—"}
                    </p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-[#0e0e0e] p-4">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                        Applications
                    </p>
                    <p className="text-2xl font-bold text-white">
                        {applicationCount} Sent
                    </p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-[#0e0e0e] p-4">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                        Resume
                    </p>
                    {resumeName ? (
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-teal-400" />
                            <p className="truncate text-sm font-medium text-teal-400">
                                {resumeName}
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">Not uploaded</p>
                    )}
                </div>
            </div>
        </div>
    );
}
