"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function CreateContestPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState("INTERNAL");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            title: formData.get("title"),
            description: formData.get("description"),
            type: formData.get("type"),
            startTime: new Date(formData.get("startTime") as string).toISOString(),
            endTime: new Date(formData.get("endTime") as string).toISOString(),
            duration: formData.get("duration") ? parseInt(formData.get("duration") as string) : null,
            platformName: formData.get("platformName"),
            contestLink: formData.get("contestLink"),
        };

        try {
            const res = await fetch("/api/contest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                const contest = await res.json();
                // Redirect to edit page if internal (to add problems), or list if external
                if (contest.type === "INTERNAL") {
                    router.push(`/teacher/contest/${contest.id}`);
                } else {
                    router.push("/teacher/contest");
                }
                router.refresh();
            } else {
                alert("Failed to create contest");
            }
        } catch (error) {
            console.error(error);
            alert("Error creating contest");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#0e0e0e] text-white p-8">
            <div className="max-w-2xl mx-auto">
                <Link href="/teacher/contest" className="mb-6 flex items-center gap-2 text-sm text-gray-400 hover:text-white">
                    <ArrowLeft className="h-4 w-4" /> Back to Contests
                </Link>

                <h1 className="mb-8 text-3xl font-bold">Create New Contest</h1>

                <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-gray-800 bg-[#161616] p-8">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Contest Title</label>
                        <input
                            name="title"
                            required
                            className="w-full rounded-lg border border-gray-800 bg-[#111111] px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                            placeholder="e.g. Weekly Code Battle #1"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Description</label>
                        <textarea
                            name="description"
                            className="w-full rounded-lg border border-gray-800 bg-[#111111] px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                            placeholder="Brief description of the contest..."
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Start Time</label>
                            <input
                                type="datetime-local"
                                name="startTime"
                                required
                                className="w-full rounded-lg border border-gray-800 bg-[#111111] px-4 py-2 text-white focus:border-blue-500 focus:outline-none [color-scheme:dark]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">End Time</label>
                            <input
                                type="datetime-local"
                                name="endTime"
                                required
                                className="w-full rounded-lg border border-gray-800 bg-[#111111] px-4 py-2 text-white focus:border-blue-500 focus:outline-none [color-scheme:dark]"
                            />
                        </div>
                    </div>

                    {type === "INTERNAL" && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Duration (Minutes)</label>
                            <input
                                type="number"
                                name="duration"
                                className="w-full rounded-lg border border-gray-800 bg-[#111111] px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                                placeholder="e.g. 120"
                            />
                            <p className="text-xs text-gray-500">
                                Time limit for students once they start the contest.
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Contest Type</label>
                        <select
                            name="type"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full rounded-lg border border-gray-800 bg-[#111111] px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                        >
                            <option value="INTERNAL">Internal (Hosted on Platform)</option>
                            <option value="EXTERNAL">External (Hosted Elsewhere)</option>
                        </select>
                    </div>

                    {type === "EXTERNAL" && (
                        <div className="animate-in slide-in-from-top-2 fade-in space-y-4 rounded-lg bg-[#111111] p-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Platform Name</label>
                                <input
                                    name="platformName"
                                    required
                                    className="w-full rounded-lg border border-gray-800 bg-[#1a1a1a] px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                                    placeholder="e.g. LeetCode, Codeforces"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Contest Link</label>
                                <input
                                    name="contestLink"
                                    type="url"
                                    required
                                    className="w-full rounded-lg border border-gray-800 bg-[#1a1a1a] px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-bold hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Creating..." : (
                            <>
                                <Save className="h-4 w-4" /> Create Contest
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
