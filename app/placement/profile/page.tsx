"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";

interface ProfileData {
    cgpa: number | null;
    batch: string | null;
    department: string | null;
    degree: string | null;
    resumeUrl: string | null;
    resumeName: string | null;
}

export default function PlacementProfilePage() {
    const [profile, setProfile] = useState<ProfileData>({
        cgpa: null,
        batch: null,
        department: null,
        degree: null,
        resumeUrl: null,
        resumeName: null,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetch("/api/placement/profile")
            .then((res) => res.json())
            .then((data) => {
                if (data.profile) setProfile(data.profile);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccess(false);

        try {
            const res = await fetch("/api/placement/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profile),
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-6 flex items-center gap-3">
                <Link href="/placement" className="rounded-lg p-2 hover:bg-gray-800 transition-colors">
                    <ArrowLeft className="h-5 w-5 text-gray-400" />
                </Link>
                <h1 className="text-2xl font-bold text-white">Placement Profile</h1>
            </div>

            <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
                <div className="rounded-2xl border border-gray-800 bg-[#111] p-6 space-y-5">
                    <h2 className="text-base font-semibold text-white mb-4">Academic Details</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Degree</label>
                            <input
                                type="text"
                                value={profile.degree || ""}
                                onChange={(e) => setProfile({ ...profile, degree: e.target.value })}
                                className="w-full rounded-xl border border-gray-700 bg-[#0e0e0e] px-4 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none transition-colors"
                                placeholder="Bachelor of Technology"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Department</label>
                            <input
                                type="text"
                                value={profile.department || ""}
                                onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                                className="w-full rounded-xl border border-gray-700 bg-[#0e0e0e] px-4 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none transition-colors"
                                placeholder="Computer Science"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">CGPA</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="10"
                                value={profile.cgpa ?? ""}
                                onChange={(e) =>
                                    setProfile({ ...profile, cgpa: e.target.value ? parseFloat(e.target.value) : null })
                                }
                                className="w-full rounded-xl border border-gray-700 bg-[#0e0e0e] px-4 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none transition-colors"
                                placeholder="8.92"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Batch</label>
                            <input
                                type="text"
                                value={profile.batch || ""}
                                onChange={(e) => setProfile({ ...profile, batch: e.target.value })}
                                className="w-full rounded-xl border border-gray-700 bg-[#0e0e0e] px-4 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none transition-colors"
                                placeholder="2020 - 2024"
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-800 bg-[#111] p-6 space-y-5">
                    <h2 className="text-base font-semibold text-white mb-4">Resume</h2>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Resume URL</label>
                        <input
                            type="url"
                            value={profile.resumeUrl || ""}
                            onChange={(e) => setProfile({ ...profile, resumeUrl: e.target.value })}
                            className="w-full rounded-xl border border-gray-700 bg-[#0e0e0e] px-4 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none transition-colors"
                            placeholder="https://drive.google.com/..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Resume Display Name</label>
                        <input
                            type="text"
                            value={profile.resumeName || ""}
                            onChange={(e) => setProfile({ ...profile, resumeName: e.target.value })}
                            className="w-full rounded-xl border border-gray-700 bg-[#0e0e0e] px-4 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none transition-colors"
                            placeholder="my_resume_v3.pdf"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition-all hover:shadow-teal-500/40 disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Save Profile
                    </button>

                    {success && (
                        <span className="text-sm text-green-400 animate-in fade-in">
                            Profile saved successfully!
                        </span>
                    )}
                </div>
            </form>
        </div>
    );
}
