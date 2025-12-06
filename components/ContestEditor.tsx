"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Edit2, Code, Globe, Database } from "lucide-react";
import ContestProblemBuilder from "./ContestProblemBuilder";

interface Props {
    contest: any;
    problems: any[];
}

export default function ContestEditor({ contest, problems }: Props) {
    const router = useRouter();
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    async function handleSaveProblem(problemData: any) {
        try {
            const res = await fetch(`/api/contest/${contest.id}/problem`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(problemData),
            });

            if (res.ok) {
                setIsBuilderOpen(false);
                router.refresh();
            } else {
                alert("Failed to save problem");
            }
        } catch (error) {
            console.error(error);
            alert("Error saving problem");
        }
    }

    async function handleDeleteProblem(problemId: string) {
        if (!confirm("Are you sure you want to delete this problem?")) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/contest/${contest.id}/problem?problemId=${problemId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                router.refresh();
            } else {
                alert("Failed to delete problem");
            }
        } catch (error) {
            console.error(error);
            alert("Error deleting problem");
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Contest Problems</h2>
                <button
                    onClick={() => setIsBuilderOpen(true)}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-bold hover:bg-blue-700"
                >
                    <Plus className="h-4 w-4" />
                    Add Problem
                </button>
            </div>

            <div className="space-y-4">
                {problems.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-800 bg-[#111111] p-12 text-center text-gray-500">
                        <p>No problems added yet.</p>
                    </div>
                ) : (
                    problems.map((prob: any, idx: number) => (
                        <div
                            key={prob.id}
                            className="flex items-center justify-between rounded-xl border border-gray-800 bg-[#161616] p-6 transition-all hover:border-gray-700"
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800 text-gray-400">
                                    <span className="font-bold">{idx + 1}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold">{prob.title}</h3>
                                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                        {prob.defaultCode && prob.defaultCode.includes("html") ? (
                                            <span className="flex items-center gap-1 text-orange-400">
                                                <Globe size={12} /> Web Dev
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-blue-400">
                                                <Code size={12} /> Coding
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleDeleteProblem(prob.id)}
                                    disabled={isDeleting}
                                    className="rounded p-2 text-gray-500 hover:bg-red-900/20 hover:text-red-400"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isBuilderOpen && (
                <ContestProblemBuilder
                    onSave={handleSaveProblem}
                    onCancel={() => setIsBuilderOpen(false)}
                />
            )}
        </div>
    );
}
