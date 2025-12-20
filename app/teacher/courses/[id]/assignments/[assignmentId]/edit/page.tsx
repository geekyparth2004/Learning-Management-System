
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Save, Trash2, Edit } from "lucide-react";
import Link from "next/link";
import ProblemBuilder from "@/components/ProblemBuilder";

export default function EditAssignmentPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.id as string;
    const assignmentId = params.assignmentId as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [title, setTitle] = useState("");
    const [problems, setProblems] = useState<any[]>([]);

    // Problem Builder State
    const [isProblemBuilderOpen, setIsProblemBuilderOpen] = useState(false);
    const [editingProblemIndex, setEditingProblemIndex] = useState<number | null>(null);
    const [currentProblem, setCurrentProblem] = useState<any>(null); // For editing

    useEffect(() => {
        const fetchAssignment = async () => {
            try {
                console.log("Fetching assignment:", assignmentId);
                const res = await fetch(`/api/assignments/${assignmentId}`);
                if (!res.ok) {
                    const text = await res.text();
                    console.error("Fetch failed:", res.status, text);
                    throw new Error(`Failed to fetch: ${res.status} ${text}`);
                }
                const data = await res.json();
                setTitle(data.title);
                setProblems(data.problems || []);
            } catch (error: any) {
                console.error("Load error:", error);
                alert(`Failed to load assignment: ${error.message}`);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAssignment();
    }, [assignmentId]);

    const handleSaveAssignment = async () => {
        if (!title) return alert("Title is required");
        setIsSaving(true);
        try {
            const res = await fetch(`/api/assignments/${assignmentId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    problems
                })
            });

            if (res.ok) {
                alert("Assignment saved successfully!");
                router.refresh();
            } else {
                throw new Error("Failed to save");
            }
        } catch (error) {
            console.error(error);
            alert("Error saving assignment");
        } finally {
            setIsSaving(false);
        }
    };

    const openAddProblem = () => {
        setCurrentProblem(null);
        setEditingProblemIndex(null);
        setIsProblemBuilderOpen(true);
    };

    const openEditProblem = (problem: any, index: number) => {
        // Parse JSON fields if they are strings (from DB)
        const parsedProblem = {
            ...problem,
            hints: typeof problem.hints === 'string' ? JSON.parse(problem.hints) : problem.hints,
            testCases: typeof problem.testCases === 'string' ? JSON.parse(problem.testCases) : problem.testCases,
            // defaultCode might need parsing if stored as string json, but our API/Builder handles it. 
            // ProblemBuilder expects raw object usually? Let's check. 
            // Actually ProblemBuilder usually constructs the object. 
        };

        setCurrentProblem(parsedProblem);
        setEditingProblemIndex(index);
        setIsProblemBuilderOpen(true);
    };

    const handleSaveProblem = (problem: any) => {
        let defaultCode = {};
        if (problem.type === "CODING" || !problem.type) { // Default to coding
            // If problem already has defaultCode and it's an object, keep it?
            // ProblemBuilder returns a constructed object usually.

            // Re-construct default code structure if needed
            defaultCode = {
                python: "# Write your code here",
                cpp: "// Write your code here",
                java: "// Write your code here"
            };
        }

        const newProblem = {
            ...problem, // Keep existing fields like ID if present (for editing existing)
            id: editingProblemIndex !== null ? problems[editingProblemIndex].id : undefined, // Preserve ID if editing
            title: problem.title,
            description: problem.description,
            testCases: problem.testCases,
            hints: JSON.stringify(problem.hints),
            defaultCode: JSON.stringify(defaultCode),
            videoSolution: problem.videoSolution,
            leetcodeUrl: problem.leetcodeUrl,
            slug: problem.leetcodeUrl ? problem.leetcodeUrl.split("/problems/")[1]?.split("/")[0] : undefined
        };

        if (editingProblemIndex !== null) {
            const updated = [...problems];
            updated[editingProblemIndex] = newProblem;
            setProblems(updated);
        } else {
            setProblems([...problems, newProblem]);
        }
        setIsProblemBuilderOpen(false);
    };

    const handleDeleteProblem = (index: number) => {
        if (!confirm("Remove this problem?")) return;
        const updated = [...problems];
        updated.splice(index, 1);
        setProblems(updated);
    };

    // Helper for S3 upload (Passed to ProblemBuilder)
    const uploadToS3 = async (file: File): Promise<string> => {
        // Re-use logic or fetch presigned url. 
        // Since I cannot allow code duplication easily without a hook, let's implement a simple fetch here.
        const res = await fetch("/api/upload/presigned-url", {
            method: "POST",
            body: JSON.stringify({ filename: file.name, contentType: file.type })
        });
        const { uploadUrl, publicUrl } = await res.json();
        await fetch(uploadUrl, { method: "PUT", body: file });
        return publicUrl;
    };


    if (isLoading) return <div className="p-8 text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-[#0e0e0e] text-white">
            {isProblemBuilderOpen && (
                <ProblemBuilder
                    initialData={currentProblem} // Pass existing data for editing
                    onSave={handleSaveProblem}
                    onCancel={() => setIsProblemBuilderOpen(false)}
                    uploadVideo={uploadToS3}
                    isUploading={false} // Manage uploading state inside if needed
                />
            )}

            <header className="border-b border-gray-800 bg-[#161616] px-6 py-4">
                <div className="mx-auto flex max-w-5xl items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/teacher/courses/${courseId}/builder`} className="text-gray-400 hover:text-white">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold">Edit Assignment</h1>
                        </div>
                    </div>
                    <button
                        onClick={handleSaveAssignment}
                        disabled={isSaving}
                        className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Save size={18} />
                        {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-4xl p-6 space-y-6">
                <div className="space-y-2">
                    <label className="text-sm text-gray-400">Assignment Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded bg-[#111111] border border-gray-800 p-3 outline-none focus:border-blue-500"
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                        <h2 className="text-lg font-semibold">Problems ({problems.length})</h2>
                        <button
                            onClick={openAddProblem}
                            className="flex items-center gap-1 rounded bg-gray-800 px-3 py-1.5 text-xs hover:bg-gray-700"
                        >
                            <Plus size={14} /> Add Problem
                        </button>
                    </div>

                    <div className="space-y-3">
                        {problems.map((p, i) => (
                            <div key={i} className="flex items-center justify-between rounded border border-gray-800 bg-[#111111] p-4">
                                <div>
                                    <h3 className="font-bold">{p.title}</h3>
                                    <p className="text-xs text-gray-500 max-w-md truncate">{p.description}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openEditProblem(p, i)}
                                        className="rounded p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteProblem(i)}
                                        className="rounded p-2 text-gray-400 hover:bg-gray-800 hover:text-red-400"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {problems.length === 0 && (
                            <div className="text-center text-gray-500 py-8 border border-dashed border-gray-800 rounded">
                                No problems added yet.
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
