"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";

export default function PostOpportunityForm() {
    const [form, setForm] = useState({
        role: "",
        company: "",
        type: "ON_CAMPUS",
        minCgpa: "",
        batchYear: "2024",
        batchYearTo: "2024",
        registrationLink: "",
        skillsRequired: "",
        location: "",
        description: "",
        driveDate: "",
        salaryMin: "",
        salaryMax: "",
        salaryType: "MONTHLY",
    });
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState("");

    const handleSubmit = async (isDraft: boolean) => {
        setSaving(true);
        setSuccess("");
        try {
            const res = await fetch("/api/coordinator/drives", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    driveDate: form.driveDate || new Date().toISOString(),
                    isDraft,
                }),
            });
            if (res.ok) {
                setSuccess(isDraft ? "Saved as draft!" : "Opportunity posted!");
                setForm({
                    role: "", company: "", type: "ON_CAMPUS", minCgpa: "",
                    batchYear: "2024", batchYearTo: "2024", registrationLink: "", skillsRequired: "", location: "", description: "", driveDate: "",
                    salaryMin: "", salaryMax: "", salaryType: "MONTHLY",
                });
                if (!isDraft) {
                    setTimeout(() => window.location.reload(), 1000);
                }
            }
        } catch {
            setSuccess("Failed to save");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900">Post New Opportunity</h3>
                <button className="text-sm text-blue-600 hover:text-blue-700">Drafts</button>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Job Title</label>
                    <input
                        type="text"
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                        placeholder="e.g. Software Development Engineer"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Company Name</label>
                        <input
                            type="text"
                            value={form.company}
                            onChange={(e) => setForm({ ...form, company: e.target.value })}
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                            placeholder="e.g. Google"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Location Type</label>
                        <select
                            value={form.type}
                            onChange={(e) => setForm({ ...form, type: e.target.value })}
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                        >
                            <option value="ON_CAMPUS">On-Campus</option>
                            <option value="OFF_CAMPUS">Off-Campus</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Min CGPA Required</label>
                        <input
                            type="number"
                            step="0.1"
                            value={form.minCgpa}
                            onChange={(e) => setForm({ ...form, minCgpa: e.target.value })}
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                            placeholder="6.5"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Batch Year</label>
                        <div className="flex gap-2">
                            <select
                                value={form.batchYear}
                                onChange={(e) => setForm({ ...form, batchYear: e.target.value })}
                                className="w-1/2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                            >
                                <option value="2024">From 2024</option>
                                <option value="2025">From 2025</option>
                                <option value="2026">From 2026</option>
                                <option value="2027">From 2027</option>
                                <option value="2028">From 2028</option>
                            </select>
                            <select
                                value={form.batchYearTo}
                                onChange={(e) => setForm({ ...form, batchYearTo: e.target.value })}
                                className="w-1/2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                            >
                                <option value="2024">To 2024</option>
                                <option value="2025">To 2025</option>
                                <option value="2026">To 2026</option>
                                <option value="2027">To 2027</option>
                                <option value="2028">To 2028</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Registration Link (Optional)</label>
                    <input
                        type="url"
                        value={form.registrationLink}
                        onChange={(e) => setForm({ ...form, registrationLink: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                        placeholder="https://example.com/apply"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Skills / Tech Stack (Optional)</label>
                    <textarea
                        rows={3}
                        value={form.skillsRequired}
                        onChange={(e) => setForm({ ...form, skillsRequired: e.target.value })}
                        className="w-full resize-y rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                        placeholder="e.g. React, Python, SQL, Node.js — list all relevant technologies"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Job Description / Responsibilities (Optional)</label>
                    <textarea
                        rows={5}
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full resize-y rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                        placeholder={`• Develop and maintain scalable backend services\n• Collaborate with cross-functional teams\n• Write clean, testable code...`}
                    />
                </div>

                <div>
                    <div className="mb-1 flex items-center justify-between">
                        <label className="text-xs font-medium text-gray-600">Salary (Optional)</label>
                        <div className="flex rounded-md border border-gray-200 overflow-hidden text-xs">
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, salaryType: "MONTHLY" })}
                                className={`px-3 py-1 font-medium transition-colors ${
                                    form.salaryType === "MONTHLY"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                                }`}
                            >
                                Monthly
                            </button>
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, salaryType: "YEARLY" })}
                                className={`px-3 py-1 font-medium transition-colors ${
                                    form.salaryType === "YEARLY"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                                }`}
                            >
                                Yearly
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
                            <input
                                type="number"
                                value={form.salaryMin}
                                onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-7 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                                placeholder={`Min (${form.salaryType === "MONTHLY" ? "/mo" : "/yr"})`}
                            />
                        </div>
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
                            <input
                                type="number"
                                value={form.salaryMax}
                                onChange={(e) => setForm({ ...form, salaryMax: e.target.value })}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-7 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                                placeholder={`Max (${form.salaryType === "MONTHLY" ? "/mo" : "/yr"})`}
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Drive Date</label>
                    <input
                        type="date"
                        value={form.driveDate}
                        onChange={(e) => setForm({ ...form, driveDate: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                    />
                </div>

                {success && (
                    <p className={`text-sm ${success.includes("Failed") ? "text-red-500" : "text-green-600"}`}>
                        {success}
                    </p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={() => handleSubmit(true)}
                        disabled={saving}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Save as Draft
                    </button>
                    <button
                        onClick={() => handleSubmit(false)}
                        disabled={saving || !form.role || !form.company}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Post Job
                    </button>
                </div>
            </div>
        </div>
    );
}
