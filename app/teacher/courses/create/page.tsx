"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function CreateCoursePage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!title || !description) {
            alert("Please fill in all fields");
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch("/api/courses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description }),
            });

            if (!res.ok) throw new Error("Failed to create course");

            const course = await res.json();
            router.push(`/teacher/courses/${course.id}/builder`);
        } catch (error) {
            console.error(error);
            alert("Failed to create course");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0e0e0e] text-white">
            <header className="border-b border-gray-800 bg-[#161616] px-6 py-4">
                <div className="mx-auto flex max-w-5xl items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-gray-400 hover:text-white">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <h1 className="text-xl font-bold">Create New Course</h1>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-2xl p-6">
                <div className="space-y-6 rounded-lg border border-gray-800 bg-[#111111] p-8">
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Course Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded border border-gray-700 bg-[#1e1e1e] px-4 py-2 focus:border-blue-500 focus:outline-none"
                            placeholder="e.g., Advanced React Patterns"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="h-32 w-full rounded border border-gray-700 bg-[#1e1e1e] px-4 py-2 focus:border-blue-500 focus:outline-none"
                            placeholder="Brief description of the course..."
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex w-full items-center justify-center gap-2 rounded bg-blue-600 px-4 py-3 font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {isSaving ? "Creating..." : "Create & Continue to Builder"}
                    </button>
                </div>
            </main>
        </div>
    );
}
