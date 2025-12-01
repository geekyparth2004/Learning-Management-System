import React, { useState } from "react";
import { X, Plus, Trash2, Video, Upload, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TestCase {
    input: string;
    expectedOutput: string;
    isHidden: boolean;
}

interface ProblemData {
    title: string;
    description: string;
    testCases: TestCase[];
    hints: string[];
    videoSolution?: string;
}

interface ProblemBuilderProps {
    onSave: (problem: ProblemData) => void;
    onCancel: () => void;
    uploadVideo: (file: File) => Promise<string>;
    isUploading?: boolean;
}

export default function ProblemBuilder({ onSave, onCancel, uploadVideo, isUploading }: ProblemBuilderProps) {
    const [activeTab, setActiveTab] = useState<"details" | "hints">("details");

    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [testCases, setTestCases] = useState<TestCase[]>([{ input: "", expectedOutput: "", isHidden: false }]);
    const [hints, setHints] = useState<string[]>([]);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState("");

    const handleAddTestCase = () => {
        setTestCases([...testCases, { input: "", expectedOutput: "", isHidden: false }]);
    };

    const handleRemoveTestCase = (index: number) => {
        setTestCases(testCases.filter((_, i) => i !== index));
    };

    const handleTestCaseChange = (index: number, field: keyof TestCase, value: string) => {
        const newTestCases = [...testCases];
        newTestCases[index] = { ...newTestCases[index], [field]: value };
        setTestCases(newTestCases);
    };

    const handleAddHint = () => {
        if (hints.length < 4) {
            setHints([...hints, ""]);
        }
    };

    const handleRemoveHint = (index: number) => {
        setHints(hints.filter((_, i) => i !== index));
    };

    const handleHintChange = (index: number, value: string) => {
        const newHints = [...hints];
        newHints[index] = value;
        setHints(newHints);
    };

    const handleSave = async () => {
        if (!title || !description) {
            alert("Title and Description are required");
            return;
        }

        let finalVideoUrl = videoUrl;
        if (videoFile) {
            try {
                finalVideoUrl = await uploadVideo(videoFile);
            } catch (error) {
                console.error("Video upload failed", error);
                alert("Failed to upload video");
                return;
            }
        }

        onSave({
            title,
            description,
            testCases,
            hints,
            videoSolution: finalVideoUrl || undefined
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-gray-800 bg-[#0e0e0e] shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-800 bg-[#161616] px-6 py-4">
                    <h2 className="text-xl font-bold text-white">Create New Problem</h2>
                    <button onClick={onCancel} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-800 bg-[#111111] px-6">
                    <button
                        onClick={() => setActiveTab("details")}
                        className={cn(
                            "border-b-2 px-6 py-3 text-sm font-medium transition-colors",
                            activeTab === "details"
                                ? "border-blue-500 text-blue-400"
                                : "border-transparent text-gray-400 hover:text-white"
                        )}
                    >
                        Problem Details
                    </button>
                    <button
                        onClick={() => setActiveTab("hints")}
                        className={cn(
                            "border-b-2 px-6 py-3 text-sm font-medium transition-colors",
                            activeTab === "hints"
                                ? "border-blue-500 text-blue-400"
                                : "border-transparent text-gray-400 hover:text-white"
                        )}
                    >
                        Hints (Optional)
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === "details" ? (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Problem Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Sum of Two Numbers"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full rounded-lg border border-gray-700 bg-[#1e1e1e] px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Problem Description</label>
                                <textarea
                                    placeholder="Describe the problem statement, input format, output format, and constraints..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="h-40 w-full rounded-lg border border-gray-700 bg-[#1e1e1e] px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-white">Test Cases</h3>
                                    <button
                                        onClick={handleAddTestCase}
                                        className="flex items-center gap-2 rounded-lg border border-gray-700 bg-[#1e1e1e] px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
                                    >
                                        <Plus size={16} /> Add Test Case
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {testCases.map((tc, idx) => (
                                        <div key={idx} className="rounded-lg border border-gray-800 bg-[#161616] p-4">
                                            <div className="mb-3 flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-400">Test Case {idx + 1}</span>
                                                {testCases.length > 1 && (
                                                    <button
                                                        onClick={() => handleRemoveTestCase(idx)}
                                                        className="text-gray-500 hover:text-red-400"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="space-y-3">
                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-500">Input</label>
                                                    <textarea
                                                        value={tc.input}
                                                        onChange={(e) => handleTestCaseChange(idx, "input", e.target.value)}
                                                        className="h-20 w-full rounded border border-gray-700 bg-[#1e1e1e] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                                                        placeholder="Test case input"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-500">Expected Output</label>
                                                    <textarea
                                                        value={tc.expectedOutput}
                                                        onChange={(e) => handleTestCaseChange(idx, "expectedOutput", e.target.value)}
                                                        className="h-20 w-full rounded border border-gray-700 bg-[#1e1e1e] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                                                        placeholder="Expected output"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">Hints (Max 4)</h3>
                                {hints.length < 4 && (
                                    <button
                                        onClick={handleAddHint}
                                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                    >
                                        <Plus size={16} /> Add Hint
                                    </button>
                                )}
                            </div>

                            {hints.length === 0 ? (
                                <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-gray-800 bg-[#111111] text-center">
                                    <p className="text-gray-400">No hints added. Click "Add Hint" to create one.</p>
                                    <div className="mt-4 flex items-center gap-2 text-xs text-yellow-500">
                                        <AlertCircle size={14} />
                                        <span>Hints unlock progressively: each hint becomes available 5 minutes after the previous one.</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {hints.map((hint, idx) => (
                                        <div key={idx} className="rounded-lg border border-gray-800 bg-[#161616] p-4">
                                            <div className="mb-3 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-white">Hint {idx + 1}</span>
                                                    {idx === 3 && (
                                                        <span className="rounded bg-purple-900/50 px-2 py-0.5 text-xs font-medium text-purple-400">
                                                            Solution Video
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveHint(idx)}
                                                    className="text-gray-500 hover:text-red-400"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-500">Hint Text (Required)</label>
                                                    <textarea
                                                        value={hint}
                                                        onChange={(e) => handleHintChange(idx, e.target.value)}
                                                        className="h-24 w-full rounded border border-gray-700 bg-[#1e1e1e] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                                                        placeholder={idx === 3 ? "Optional hint text for the solution video" : "Enter hint text"}
                                                    />
                                                </div>

                                                {idx === 3 && (
                                                    <div className="space-y-1">
                                                        <label className="text-xs text-gray-500">Solution Video (Required for last hint)</label>
                                                        <div className="flex items-center gap-4 rounded border border-gray-700 bg-[#1e1e1e] p-3">
                                                            <label className="flex cursor-pointer items-center gap-2 rounded bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
                                                                <Upload size={16} />
                                                                Choose file
                                                                <input
                                                                    type="file"
                                                                    accept="video/*"
                                                                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                                                                    className="hidden"
                                                                />
                                                            </label>
                                                            <span className="text-sm text-gray-400">
                                                                {videoFile ? videoFile.name : "No file chosen"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <Clock size={12} />
                                                    <span>
                                                        {idx === 0
                                                            ? "Unlocks immediately"
                                                            : `Unlocks after ${idx * 5} minutes`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t border-gray-800 bg-[#161616] px-6 py-4">
                    <button
                        onClick={onCancel}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isUploading}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isUploading ? "Uploading..." : "Save Problem"}
                    </button>
                </div>
            </div>
        </div>
    );
}
