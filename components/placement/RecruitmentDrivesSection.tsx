"use client";

import React, { useState } from "react";
import { BadgeIndianRupee, Calendar, CheckCircle2, ChevronDown, ChevronUp, MapPin, Plus } from "lucide-react";

interface Drive {
    id: string;
    company: string;
    role: string;
    location?: string;
    driveDate: string;
    status: string;
    eligibility?: string;
    companyLogo?: string;
    hasApplied: boolean;
    applicantCount: number;
    batchYear?: string;
    batchYearTo?: string;
    registrationLink?: string;
    salaryMin?: number;
    salaryMax?: number;
    salaryType?: string;
    description?: string;
}

interface RecruitmentDrivesSectionProps {
    drives: Drive[];
}

function DriveCard({ drive, onRegister }: { drive: Drive; onRegister: (id: string, link?: string) => void }) {
    const [jdOpen, setJdOpen] = useState(false);

    const statusColors: Record<string, string> = {
        UPCOMING: "border-teal-500/40 bg-teal-500/10 text-teal-300",
        ONGOING: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300",
        COMPLETED: "border-gray-600/40 bg-gray-600/10 text-gray-400",
    };

    const borderColors: Record<string, string> = {
        UPCOMING: "border-teal-500/30 hover:border-teal-500/60",
        ONGOING: "border-yellow-500/30 hover:border-yellow-500/60",
        COMPLETED: "border-gray-700 hover:border-gray-600",
    };

    const formatSalary = (val: number, type?: string) => {
        const suffix = type === "YEARLY" ? "/yr" : "/mo";
        if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L${suffix}`;
        if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K${suffix}`;
        return `₹${val}${suffix}`;
    };

    const salaryLabel = (() => {
        if (!drive.salaryMin && !drive.salaryMax) return null;
        if (drive.salaryMin && drive.salaryMax)
            return `${formatSalary(drive.salaryMin, drive.salaryType)} – ${formatSalary(drive.salaryMax, drive.salaryType)}`;
        if (drive.salaryMin) return formatSalary(drive.salaryMin, drive.salaryType);
        return formatSalary(drive.salaryMax!, drive.salaryType);
    })();

    return (
        <div
            className={`group flex flex-col rounded-2xl border bg-[#111] p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg ${borderColors[drive.status] || "border-gray-800"}`}
        >
            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 text-sm font-bold text-white">
                    {drive.company.charAt(0)}
                </div>
                <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusColors[drive.status] || ""}`}
                >
                    {drive.status}
                </span>
            </div>

            {/* Job Title & Company */}
            <h3 className="mb-0.5 text-base font-bold text-white">{drive.role}</h3>
            <p className="mb-3 text-sm font-medium text-gray-300">
                {drive.company}
                {drive.location ? <span className="text-gray-500"> • {drive.location}</span> : null}
            </p>

            {/* Salary badge */}
            {salaryLabel && (
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 self-start">
                    <BadgeIndianRupee className="h-3.5 w-3.5" />
                    {salaryLabel}
                </div>
            )}

            {/* Details */}
            <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                        {new Date(drive.driveDate).toLocaleDateString("en-US", {
                            month: "long",
                            day: "2-digit",
                            year: "numeric",
                        })}
                    </span>
                </div>
                {drive.eligibility && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <CheckCircle2 className="h-3.5 w-3.5 text-teal-500" />
                        <span>{drive.eligibility}</span>
                    </div>
                )}
                {(drive.batchYear || drive.batchYearTo) && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <CheckCircle2 className="h-3.5 w-3.5 text-teal-500" />
                        <span>
                            Batch: {drive.batchYear && drive.batchYearTo && drive.batchYear !== drive.batchYearTo ? `${drive.batchYear} - ${drive.batchYearTo}` : drive.batchYear || drive.batchYearTo}
                        </span>
                    </div>
                )}
            </div>

            {/* JD / Responsibilities accordion */}
            {drive.description && (
                <div className="mb-4 rounded-xl border border-gray-800 bg-[#0d0d0d] overflow-hidden">
                    <button
                        onClick={() => setJdOpen((o) => !o)}
                        className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-gray-400 hover:text-gray-200 transition-colors"
                    >
                        <span>Job Description / Responsibilities</span>
                        {jdOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                    {jdOpen && (
                        <div className="border-t border-gray-800 px-3 py-2.5">
                            <p className="whitespace-pre-wrap text-xs leading-relaxed text-gray-400">{drive.description}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Action */}
            <div className="mt-auto">
                {drive.hasApplied ? (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-center gap-2 rounded-xl border border-teal-500/30 bg-teal-500/5 py-2.5 text-sm font-medium text-teal-400">
                            <CheckCircle2 className="h-4 w-4" />
                            Registered
                        </div>
                        {drive.registrationLink && (
                            <button
                                onClick={() => onRegister(drive.id, drive.registrationLink)}
                                className="w-full rounded-xl border border-teal-500/30 bg-teal-500/5 py-2.5 text-sm font-medium text-teal-400 transition-all hover:bg-teal-500/15 hover:border-teal-500/50"
                            >
                                Apply Externally
                            </button>
                        )}
                    </div>
                ) : drive.status !== "COMPLETED" ? (
                    <button
                        onClick={() => onRegister(drive.id, drive.registrationLink)}
                        className="w-full rounded-xl border border-teal-500/30 bg-teal-500/5 py-2.5 text-sm font-medium text-teal-400 transition-all hover:bg-teal-500/15 hover:border-teal-500/50"
                    >
                        {drive.registrationLink ? "Apply Externally" : "Register Now"}
                    </button>
                ) : (
                    <div className="text-center text-sm text-gray-600 py-2.5">
                        Drive Completed
                    </div>
                )}
            </div>
        </div>
    );
}

export default function RecruitmentDrivesSection({ drives }: RecruitmentDrivesSectionProps) {
    const filteredDrives = drives.filter((d) => d.status !== "COMPLETED");

    const handleRegister = async (driveId: string, registrationLink?: string) => {
        if (registrationLink) {
            window.open(registrationLink, "_blank");
            return;
        }

        try {
            const res = await fetch("/api/placement/applications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ driveId }),
            });
            if (res.ok) {
                window.location.reload();
            }
        } catch (error) {
            console.error("Failed to register:", error);
        }
    };

    return (
        <div className="rounded-2xl border border-gray-800 bg-[#111] p-6">
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-white">Recruitment Drives</h3>
                    <p className="text-sm text-gray-500">
                        Stay updated with the latest institutional placement activities.
                    </p>
                </div>
            </div>

            {/* Drives Grid */}
            {filteredDrives.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDrives.map((drive) => (
                        <DriveCard key={drive.id} drive={drive} onRegister={handleRegister} />
                    ))}
                    {/* More Drives Placeholder */}
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-700 bg-[#0a0a0a] p-8 text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-gray-700 bg-[#111]">
                            <Plus className="h-5 w-5 text-gray-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">More Drives Expected</p>
                        <p className="mt-1 text-xs text-gray-600">
                            Check back later for newly announced recruitment windows.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-700 bg-[#0a0a0a] py-12 text-center">
                    <MapPin className="mb-3 h-8 w-8 text-gray-600" />
                    <p className="text-sm text-gray-500">
                        No active drives right now.
                    </p>
                </div>
            )}
        </div>
    );
}
