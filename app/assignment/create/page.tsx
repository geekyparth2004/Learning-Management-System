"use client";

import React, { useState } from "react";
import { Plus, Trash2, Save, ArrowLeft, Upload, FileVideo } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface TestCase {
    id: string;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
}

export default function CreateAssignmentPage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    // Hints State
    const [hints, setHints] = useState<string[]>(["", "", ""]);
    const [hint4Type, setHint4Type] = useState<"text" | "video">("text");
    const [hint4Text, setHint4Text] = useState("");
    const [hint4Video, setHint4Video] = useState<File | null>(null);

    const [testCases, setTestCases] = useState<TestCase[]>([
        { id: "1", input: "", expectedOutput: "", isHidden: false },
    ]);
    const [isSaving, setIsSaving] = useState(false);

    const addTestCase = () => {
        setTestCases([
            ...testCases,
            {
                id: Math.random().toString(36).substr(2, 9),
                input: "",
                expectedOutput: "",
                isHidden: false,
            },
        ]);
    };

    const removeTestCase = (id: string) => {
        setTestCases(testCases.filter((tc) => tc.id !== id));
    };

    const updateTestCase = (id: string, field: keyof TestCase, value: any) => {
        setTestCases(
            testCases.map((tc) => (tc.id === id ? { ...tc, [field]: value } : tc))
        );
    };

    const handleHintChange = (index: number, value: string) => {
        const newHints = [...hints];
        newHints[index] = value;
        setHints(newHints);
    };

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setHint4Video(e.target.files[0]);
        }
    };

    const uploadToDrive = async (file: File): Promise<string> => {
        // 1. Get the resumable upload URL from our API
        const initRes = await fetch("/api/upload/video", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                filename: file.name,
                contentType: file.type,
            }),
        });

        if (!initRes.ok) throw new Error("Failed to initiate upload");
        const { uploadUrl } = await initRes.json();

        // 2. Upload the file directly to Google Drive
        const uploadRes = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
                "Content-Type": file.type,
            },
            body: file,
        });

        if (!uploadRes.ok) throw new Error("Failed to upload file to Drive");
        const driveFile = await uploadRes.json();

        // 3. Return the preview link (we'll use the alternateLink or build a preview link)
        // The Drive API returns 'id' field. We can construct a preview URL.
        return `https://drive.google.com/file/d/${driveFile.id}/preview`;
    };

    const handleSave = async () => {
        if (!title || !description) {
            alert("Please fill in all fields");
            return;
        }

        setIsSaving(true);
        try {
            let videoUrl = "";
            if (hint4Type === "video" && hint4Video) {
                // Upload video first
                try {
                    videoUrl = await uploadToDrive(hint4Video);
                } catch (e) {
                    console.error("Video upload failed:", e);
                    alert("Failed to upload video. Please try again.");
                    setIsSaving(false);
                    return;
                }
            }

            const formData = new FormData();
            formData.append("title", title);

            // Prepare hints array
            const finalHints = [...hints];
            if (hint4Type === "text") {
                finalHints.push(hint4Text);
            } else {
                finalHints.push(videoUrl); // Send the Google Drive URL
            }

            // Prepare problems array (currently single problem)
            const problems = [
                {
                    title,
                    description,
                    defaultCode: {
                        cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}`,
                        python: `# Write your code here\n`,
                    },
                    hints: finalHints,
                    testCases: testCases.map(({ input, expectedOutput, isHidden }) => ({
                        input,
                        expectedOutput,
                        isHidden,
                    })),
                },
            ];

            formData.append("problems", JSON.stringify(problems));
            // No need to append video file anymore

            const res = await fetch("/api/assignments", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Failed to save");

            router.push("/");
        } catch (error) {
            console.error(error);
            alert("Failed to save assignment");
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
                        <h1 className="text-xl font-bold">Create Assignment</h1>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 rounded bg-green-600 px-4 py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {isSaving ? "Saving..." : "Save Assignment"}
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-5xl p-6">
                <div className="space-y-8">
                    {/* General Info */}
                    <section className="space-y-4 rounded-lg border border-gray-800 bg-[#111111] p-6">
                        <h2 className="text-lg font-semibold">Problem Details</h2>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Problem Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full rounded border border-gray-700 bg-[#1e1e1e] px-4 py-2 focus:border-blue-500 focus:outline-none"
                                placeholder="e.g., Sum of Two Numbers"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Description (Markdown)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="h-40 w-full rounded border border-gray-700 bg-[#1e1e1e] px-4 py-2 focus:border-blue-500 focus:outline-none"
                                placeholder="# Problem Description..."
                            />
                        </div>
                    </section>

                    {/* Hints Section */}
                    <section className="space-y-4 rounded-lg border border-gray-800 bg-[#111111] p-6">
                        <h2 className="text-lg font-semibold">Hints & Solution</h2>
                        <p className="text-sm text-gray-400">Add up to 4 hints. Hints unlock every 5 minutes.</p>

                        <div className="space-y-4">
                            {[0, 1, 2].map((idx) => (
                                <div key={idx} className="space-y-2">
                                    <label className="text-sm text-gray-400">Hint {idx + 1} (Text)</label>
                                    <input
                                        type="text"
                                        value={hints[idx]}
                                        onChange={(e) => handleHintChange(idx, e.target.value)}
                                        className="w-full rounded border border-gray-700 bg-[#1e1e1e] px-4 py-2 focus:border-blue-500 focus:outline-none"
                                        placeholder={`Enter hint ${idx + 1}...`}
                                    />
                                </div>
                            ))}

                            {/* Hint 4 / Video Solution */}
                            <div className="space-y-2 rounded border border-gray-700 bg-[#1e1e1e] p-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-white">Hint 4 / Solution</label>
                                    <div className="flex rounded bg-[#111111] p-1">
                                        <button
                                            onClick={() => setHint4Type("text")}
                                            className={cn(
                                                "rounded px-3 py-1 text-xs font-medium transition-colors",
                                                hint4Type === "text" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                                            )}
                                        >
                                            Text
                                        </button>
                                        <button
                                            onClick={() => setHint4Type("video")}
                                            className={cn(
                                                "rounded px-3 py-1 text-xs font-medium transition-colors",
                                                hint4Type === "video" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                                            )}
                                        >
                                            Video
                                        </button>
                                    </div>
                                </div>

                                {hint4Type === "text" ? (
                                    <input
                                        type="text"
                                        value={hint4Text}
                                        onChange={(e) => setHint4Text(e.target.value)}
                                        className="w-full rounded border border-gray-700 bg-[#111111] px-4 py-2 focus:border-blue-500 focus:outline-none"
                                        placeholder="Enter final hint text..."
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center rounded border-2 border-dashed border-gray-700 bg-[#111111] p-6">
                                        <input
                                            type="file"
                                            accept="video/*"
                                            onChange={handleVideoUpload}
                                            className="hidden"
                                            id="video-upload"
                                        />
                                        <label
                                            htmlFor="video-upload"
                                            className="flex cursor-pointer flex-col items-center gap-2 text-gray-400 hover:text-white"
                                        >
                                            {hint4Video ? (
                                                <>
                                                    <FileVideo className="h-8 w-8 text-blue-500" />
                                                    <span className="text-sm font-medium text-blue-400">{hint4Video.name}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="h-8 w-8" />
                                                    <span className="text-sm">Click to upload video solution</span>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Test Cases */}
                    <section className="space-y-4 rounded-lg border border-gray-800 bg-[#111111] p-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Test Cases</h2>
                            <button
                                onClick={addTestCase}
                                className="flex items-center gap-2 rounded border border-gray-700 px-3 py-1.5 text-sm hover:bg-gray-800"
                            >
                                <Plus className="h-4 w-4" />
                                Add Test Case
                            </button>
                        </div>

                        <div className="space-y-4">
                            {testCases.map((tc, idx) => (
                                <div
                                    key={tc.id}
                                    className="relative grid grid-cols-1 gap-4 rounded border border-gray-700 bg-[#1e1e1e] p-4 md:grid-cols-2"
                                >
                                    <div className="absolute right-2 top-2 flex gap-2">
                                        <button
                                            onClick={() => updateTestCase(tc.id, "isHidden", !tc.isHidden)}
                                            className={cn(
                                                "rounded px-2 py-1 text-xs font-medium transition-colors",
                                                tc.isHidden
                                                    ? "bg-purple-900 text-purple-200"
                                                    : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                                            )}
                                        >
                                            {tc.isHidden ? "Hidden" : "Visible"}
                                        </button>
                                        <button
                                            onClick={() => removeTestCase(tc.id)}
                                            className="text-gray-500 hover:text-red-400"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-500">Input</label>
                                        <textarea
                                            value={tc.input}
                                            onChange={(e) => updateTestCase(tc.id, "input", e.target.value)}
                                            className="h-24 w-full rounded border border-gray-700 bg-[#111111] p-2 font-mono text-sm focus:border-blue-500 focus:outline-none"
                                            placeholder="Input data..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-500">Expected Output</label>
                                        <textarea
                                            value={tc.expectedOutput}
                                            onChange={(e) =>
                                                updateTestCase(tc.id, "expectedOutput", e.target.value)
                                            }
                                            className="h-24 w-full rounded border border-gray-700 bg-[#111111] p-2 font-mono text-sm focus:border-blue-500 focus:outline-none"
                                            placeholder="Expected output..."
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
