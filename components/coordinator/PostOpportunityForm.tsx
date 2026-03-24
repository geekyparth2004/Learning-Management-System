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
        skillsRequired: "",
        location: "",
        description: "",
        driveDate: "",
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
                    batchYear: "2024", skillsRequired: "", location: "", description: "", driveDate: "",
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
                        <select
                            value={form.batchYear}
                            onChange={(e) => setForm({ ...form, batchYear: e.target.value })}
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                        >
                            <option value="2024">2024</option>
                            <option value="2025">2025</option>
                            <option value="2026">2026</option>
                            <option value="2027">2027</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Skills Required (Comma separated)</label>
                    <input
                        type="text"
                        value={form.skillsRequired}
                        onChange={(e) => setForm({ ...form, skillsRequired: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                        placeholder="React, Python, SQL"
                    />
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
