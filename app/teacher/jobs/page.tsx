"use client";

import React, { useEffect, useState } from "react";
import {
    Briefcase,
    Plus,
    Trash2,
    MapPin,
    Building2,
    ExternalLink,
    X,
    Loader2,
    DollarSign,
    Link as LinkIcon,
    FileText,
    Tag,
} from "lucide-react";

interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    salary?: string | null;
    type: string;
    description?: string | null;
    link: string;
    platform: string;
    createdAt: string;
}

const JOB_TYPES = [
    { value: "FULL_TIME", label: "Full Time" },
    { value: "INTERNSHIP", label: "Internship" },
    { value: "CONTRACT", label: "Contract" },
    { value: "PART_TIME", label: "Part Time" },
];

const PLATFORMS = ["Direct", "LinkedIn", "Naukri", "Internshala", "Indeed", "Instahyre", "Other"];

export default function TeacherJobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Form state
    const [form, setForm] = useState({
        title: "",
        company: "",
        location: "",
        salary: "",
        type: "FULL_TIME",
        description: "",
        link: "",
        platform: "Direct",
    });

    const fetchJobs = async () => {
        try {
            const res = await fetch("/api/teacher/jobs");
            if (res.ok) {
                const data = await res.json();
                setJobs(data);
            }
        } catch (error) {
            console.error("Failed to fetch jobs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title || !form.company || !form.location || !form.link) return;

        setSubmitting(true);
        try {
            const res = await fetch("/api/teacher/jobs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (res.ok) {
                setForm({
                    title: "",
                    company: "",
                    location: "",
                    salary: "",
                    type: "FULL_TIME",
                    description: "",
                    link: "",
                    platform: "Direct",
                });
                setShowForm(false);
                fetchJobs();
            }
        } catch (error) {
            console.error("Failed to create job:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this job posting?")) return;

        setDeletingId(id);
        try {
            const res = await fetch(`/api/teacher/jobs/${id}`, { method: "DELETE" });
            if (res.ok) {
                setJobs((prev) => prev.filter((j) => j.id !== id));
            }
        } catch (error) {
            console.error("Failed to delete job:", error);
        } finally {
            setDeletingId(null);
        }
    };

    const typeColors: Record<string, string> = {
        FULL_TIME: "bg-emerald-900/30 text-emerald-400 border-emerald-500/20",
        INTERNSHIP: "bg-blue-900/30 text-blue-400 border-blue-500/20",
        CONTRACT: "bg-orange-900/30 text-orange-400 border-orange-500/20",
        PART_TIME: "bg-purple-900/30 text-purple-400 border-purple-500/20",
    };

    const typeLabels: Record<string, string> = {
        FULL_TIME: "Full Time",
        INTERNSHIP: "Internship",
        CONTRACT: "Contract",
        PART_TIME: "Part Time",
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Job Postings</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Post job opportunities for students. All posted jobs are visible to logged-in students.
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
                >
                    {showForm ? <X size={18} /> : <Plus size={18} />}
                    {showForm ? "Cancel" : "Post New Job"}
                </button>
            </div>

            {/* Add Job Form */}
            {showForm && (
                <form
                    onSubmit={handleSubmit}
                    className="rounded-2xl border border-gray-800 bg-[#161616] p-6 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300"
                >
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Briefcase size={20} className="text-blue-400" />
                        New Job Posting
                    </h2>

                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Title */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                                <FileText size={12} /> Job Title *
                            </label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                placeholder="e.g. Frontend Developer"
                                required
                                className="w-full rounded-lg border border-gray-700 bg-[#1a1a1a] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors"
                            />
                        </div>

                        {/* Company */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                                <Building2 size={12} /> Company *
                            </label>
                            <input
                                type="text"
                                value={form.company}
                                onChange={(e) => setForm({ ...form, company: e.target.value })}
                                placeholder="e.g. Google"
                                required
                                className="w-full rounded-lg border border-gray-700 bg-[#1a1a1a] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors"
                            />
                        </div>

                        {/* Location */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                                <MapPin size={12} /> Location *
                            </label>
                            <input
                                type="text"
                                value={form.location}
                                onChange={(e) => setForm({ ...form, location: e.target.value })}
                                placeholder="e.g. Noida, India"
                                required
                                className="w-full rounded-lg border border-gray-700 bg-[#1a1a1a] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors"
                            />
                        </div>

                        {/* Salary */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                                <DollarSign size={12} /> Salary
                            </label>
                            <input
                                type="text"
                                value={form.salary}
                                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                                placeholder="e.g. ₹8L - ₹12L"
                                className="w-full rounded-lg border border-gray-700 bg-[#1a1a1a] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors"
                            />
                        </div>

                        {/* Job Type */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                                <Tag size={12} /> Job Type
                            </label>
                            <select
                                value={form.type}
                                onChange={(e) => setForm({ ...form, type: e.target.value })}
                                className="w-full rounded-lg border border-gray-700 bg-[#1a1a1a] px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors"
                            >
                                {JOB_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Platform */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                                <ExternalLink size={12} /> Platform
                            </label>
                            <select
                                value={form.platform}
                                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                                className="w-full rounded-lg border border-gray-700 bg-[#1a1a1a] px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors"
                            >
                                {PLATFORMS.map((p) => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Apply Link */}
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                                <LinkIcon size={12} /> Apply Link *
                            </label>
                            <input
                                type="url"
                                value={form.link}
                                onChange={(e) => setForm({ ...form, link: e.target.value })}
                                placeholder="https://careers.google.com/jobs/..."
                                required
                                className="w-full rounded-lg border border-gray-700 bg-[#1a1a1a] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-xs font-medium text-gray-400">Description</label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Job description, requirements, etc."
                                rows={3}
                                className="w-full rounded-lg border border-gray-700 bg-[#1a1a1a] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors resize-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Posting...
                                </>
                            ) : (
                                <>
                                    <Plus size={16} />
                                    Post Job
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}

            {/* Jobs List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-28 rounded-xl border border-gray-800 bg-[#161616] animate-pulse" />
                    ))}
                </div>
            ) : jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-700 bg-[#161616]/50 py-16 text-center">
                    <div className="rounded-full bg-gray-800 p-4 mb-4">
                        <Briefcase size={32} className="text-gray-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-300">No jobs posted yet</h3>
                    <p className="mt-1 text-sm text-gray-500 max-w-sm">
                        Post your first job opportunity and it will be visible to all students on the platform.
                    </p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="mt-6 flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
                    >
                        <Plus size={16} />
                        Post Your First Job
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-xs text-gray-500">{jobs.length} job{jobs.length !== 1 ? "s" : ""} posted</p>
                    {jobs.map((job) => (
                        <div
                            key={job.id}
                            className="group flex items-start justify-between gap-4 rounded-xl border border-gray-800 bg-[#161616] p-5 transition-all hover:border-gray-700"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h3 className="font-bold text-white truncate">{job.title}</h3>
                                    <span
                                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                            typeColors[job.type] || "bg-gray-800 text-gray-400 border-gray-700"
                                        }`}
                                    >
                                        {typeLabels[job.type] || job.type}
                                    </span>
                                    <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider text-gray-400">
                                        {job.platform}
                                    </span>
                                </div>

                                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <Building2 size={12} /> {job.company}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin size={12} /> {job.location}
                                    </span>
                                    {job.salary && (
                                        <span className="text-green-400">₹ {job.salary}</span>
                                    )}
                                </div>

                                {job.description && (
                                    <p className="mt-2 text-xs text-gray-500 line-clamp-2">{job.description}</p>
                                )}

                                <div className="mt-2 text-[10px] text-gray-600">
                                    Posted {new Date(job.createdAt).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <a
                                    href={job.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-lg bg-blue-600/10 p-2 text-blue-400 hover:bg-blue-600 hover:text-white transition-colors"
                                    title="Open link"
                                >
                                    <ExternalLink size={16} />
                                </a>
                                <button
                                    onClick={() => handleDelete(job.id)}
                                    disabled={deletingId === job.id}
                                    className="rounded-lg bg-red-600/10 p-2 text-red-400 hover:bg-red-600 hover:text-white disabled:opacity-50 transition-colors"
                                    title="Delete job"
                                >
                                    {deletingId === job.id ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Trash2 size={16} />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
