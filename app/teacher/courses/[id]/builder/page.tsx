"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Clock, Video, FileCode, GripVertical, Upload } from "lucide-react";
import Link from "next/link";

interface ModuleItem {
    id: string;
    title: string;
    type: "VIDEO" | "ASSIGNMENT";
    content?: string;
    assignmentId?: string;
}

interface Module {
    id: string;
    title: string;
    timeLimit: number;
    items: ModuleItem[];
}

interface Course {
    id: string;
    title: string;
    modules: Module[];
}

export default function CourseBuilderPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.id as string;
    const [course, setCourse] = useState<Course | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // New Module State
    const [isAddingModule, setIsAddingModule] = useState(false);
    const [newModuleTitle, setNewModuleTitle] = useState("");
    const [newModuleTime, setNewModuleTime] = useState("48"); // Default 48 hours

    // New Item State
    const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
    const [newItemType, setNewItemType] = useState<"VIDEO" | "ASSIGNMENT" | "AI_INTERVIEW" | "TEST">("VIDEO");
    const [newItemTitle, setNewItemTitle] = useState("");
    const [newItemContent, setNewItemContent] = useState(""); // URL or Assignment ID
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    // AI Interview State
    const [aiTopic, setAiTopic] = useState("");
    const [aiCount, setAiCount] = useState(5);

    // Test State
    const [testDuration, setTestDuration] = useState(30);
    const [testPassingScore, setTestPassingScore] = useState(60);
    const [testProblems, setTestProblems] = useState<any[]>([]);

    // Test Problem Input State
    const [tpTitle, setTpTitle] = useState("");
    const [tpDesc, setTpDesc] = useState("");
    const [tpInput, setTpInput] = useState("");
    const [tpOutput, setTpOutput] = useState("");

    const addTestProblem = () => {
        if (!tpTitle || !tpDesc) return;
        setTestProblems([...testProblems, {
            title: tpTitle,
            description: tpDesc,
            testCases: [{ input: tpInput, expectedOutput: tpOutput, isHidden: false }]
        }]);
        setTpTitle("");
        setTpDesc("");
        setTpInput("");
        setTpOutput("");
    };

    const uploadToCloudinary = async (file: File) => {
        let sigData;
        try {
            const sigRes = await fetch("/api/upload/video", { method: "POST" });
            if (!sigRes.ok) throw new Error("Failed to get signature");
            sigData = await sigRes.json();
        } catch (err: any) {
            throw new Error(`Failed to setup upload: ${err.message}`);
        }

        const { signature, timestamp, cloudName, apiKey, folder } = sigData;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp.toString());
        formData.append("signature", signature);
        formData.append("folder", folder);

        return new Promise<string>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(percent);
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const data = JSON.parse(xhr.responseText);
                    resolve(data.secure_url);
                } else {
                    reject(new Error("Upload failed"));
                }
            };

            xhr.onerror = () => reject(new Error("Network error"));
            xhr.send(formData);
        });
    };

    useEffect(() => {
        fetchCourse();
    }, [courseId]);

    const fetchCourse = async () => {
        try {
            const res = await fetch(`/api/courses/${courseId}/builder`);
            if (!res.ok) throw new Error("Failed to fetch course");
            const data = await res.json();
            setCourse(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const addModule = async () => {
        if (!newModuleTitle) return;
        try {
            const res = await fetch(`/api/courses/${courseId}/modules`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: newModuleTitle,
                    timeLimit: parseInt(newModuleTime) * 60, // Convert hours to minutes
                }),
            });
            if (res.ok) {
                setNewModuleTitle("");
                setIsAddingModule(false);
                fetchCourse();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const deleteModule = async (moduleId: string) => {
        if (!confirm("Delete this module?")) return;
        try {
            await fetch(`/api/modules/${moduleId}`, { method: "DELETE" });
            fetchCourse();
        } catch (error) {
            console.error(error);
        }
    };

    const addItem = async () => {
        if (!activeModuleId || !newItemTitle) return;

        let content = newItemContent;

        try {
            if (newItemType === "VIDEO" && videoFile) {
                setIsUploading(true);
                content = await uploadToCloudinary(videoFile);
                setIsUploading(false);
            } else if (newItemType === "AI_INTERVIEW") {
                content = JSON.stringify({ topic: aiTopic, count: aiCount });
            } else if (newItemType === "TEST") {
                content = JSON.stringify({
                    duration: testDuration,
                    passingScore: testPassingScore,
                    problems: testProblems
                });
            }

            const res = await fetch(`/api/modules/${activeModuleId}/items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: newItemTitle,
                    type: newItemType,
                    content: content,
                }),
            });
            if (res.ok) {
                setActiveModuleId(null);
                setNewItemTitle("");
                setNewItemContent("");
                setVideoFile(null);
                setAiTopic("");
                setAiCount(5);
                setTestProblems([]);
                setUploadProgress(0);
                fetchCourse();
            }
        } catch (error) {
            console.error(error);
            setIsUploading(false);
            alert("Failed to add item");
        }
    };

    const deleteItem = async (itemId: string) => {
        if (!confirm("Delete this item?")) return;
        try {
            await fetch(`/api/items/${itemId}`, { method: "DELETE" });
            fetchCourse();
        } catch (error) {
            console.error(error);
        }
    };

    if (isLoading) return <div className="p-8 text-white">Loading...</div>;
    if (!course) return <div className="p-8 text-white">Course not found</div>;

    return (
        <div className="min-h-screen bg-[#0e0e0e] text-white">
            <header className="border-b border-gray-800 bg-[#161616] px-6 py-4">
                <div className="mx-auto flex max-w-5xl items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/teacher/courses" className="text-gray-400 hover:text-white">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold">{course.title}</h1>
                            <p className="text-sm text-gray-400">Course Builder</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-4xl p-6">
                <div className="space-y-6">
                    {course.modules.map((module, index) => (
                        <div key={module.id} className="rounded-lg border border-gray-800 bg-[#111111] overflow-hidden">
                            <div className="flex items-center justify-between bg-[#161616] px-6 py-4 border-b border-gray-800">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-900/50 text-xs font-bold text-blue-400">
                                        {index + 1}
                                    </span>
                                    <h3 className="font-semibold">{module.title}</h3>
                                    <div className="flex items-center gap-1 rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                                        <Clock size={12} />
                                        <span>{Math.round(module.timeLimit / 60)}h</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => deleteModule(module.id)}
                                        className="text-gray-500 hover:text-red-400"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 space-y-3">
                                {module.items.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between rounded border border-gray-800 bg-[#1e1e1e] p-3">
                                        <div className="flex items-center gap-3">
                                            <GripVertical className="text-gray-600 cursor-move" size={16} />
                                            {item.type === "VIDEO" ? (
                                                <Video size={16} className="text-blue-400" />
                                            ) : (
                                                <FileCode size={16} className="text-purple-400" />
                                            )}
                                            <span className="text-sm">{item.title}</span>
                                        </div>
                                        <button
                                            onClick={() => deleteItem(item.id)}
                                            className="text-gray-500 hover:text-red-400"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}

                                {activeModuleId === module.id ? (
                                    <div className="rounded border border-dashed border-gray-700 bg-[#1e1e1e] p-4 space-y-3">
                                        <div className="flex gap-2">
                                            <select
                                                value={newItemType}
                                                onChange={(e) => setNewItemType(e.target.value as any)}
                                                className="rounded bg-[#111111] border border-gray-700 px-2 py-1 text-sm"
                                            >
                                                <option value="VIDEO">Video</option>
                                                <option value="ASSIGNMENT">Assignment</option>
                                                <option value="AI_INTERVIEW">AI Interview</option>
                                                <option value="TEST">Test</option>
                                            </select>
                                            <input
                                                type="text"
                                                placeholder="Item Title"
                                                value={newItemTitle}
                                                onChange={(e) => setNewItemTitle(e.target.value)}
                                                className="flex-1 rounded bg-[#111111] border border-gray-700 px-3 py-1 text-sm"
                                            />

                                        </div>

                                        {newItemType === "VIDEO" ? (
                                            <div className="space-y-2">
                                                <div className="flex flex-col items-center justify-center rounded border-2 border-dashed border-gray-700 bg-[#111111] p-6">
                                                    <input
                                                        type="file"
                                                        accept="video/*"
                                                        onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                                                        className="hidden"
                                                        id="video-upload"
                                                    />
                                                    <label
                                                        htmlFor="video-upload"
                                                        className="flex cursor-pointer flex-col items-center gap-2 text-gray-400 hover:text-white"
                                                    >
                                                        {videoFile ? (
                                                            <>
                                                                <Video className="h-8 w-8 text-blue-500" />
                                                                <span className="text-sm font-medium text-blue-400">{videoFile.name}</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Upload className="h-8 w-8" />
                                                                <span className="text-sm">Click to upload video</span>
                                                            </>
                                                        )}
                                                    </label>
                                                </div>
                                                {uploadProgress > 0 && (
                                                    <div className="h-1 w-full overflow-hidden rounded-full bg-gray-800">
                                                        <div
                                                            className="h-full bg-blue-500 transition-all duration-300"
                                                            style={{ width: `${uploadProgress}%` }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ) : newItemType === "AI_INTERVIEW" ? (
                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    placeholder="Interview Topic (e.g. React Hooks)"
                                                    value={aiTopic}
                                                    onChange={(e) => setAiTopic(e.target.value)}
                                                    className="w-full rounded bg-[#111111] border border-gray-700 px-3 py-1 text-sm"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <label className="text-sm text-gray-400">Questions:</label>
                                                    <input
                                                        type="number"
                                                        value={aiCount}
                                                        onChange={(e) => setAiCount(parseInt(e.target.value))}
                                                        className="w-20 rounded bg-[#111111] border border-gray-700 px-3 py-1 text-sm"
                                                    />
                                                </div>
                                            </div>
                                        ) : newItemType === "TEST" ? (
                                            <div className="space-y-3 rounded border border-gray-800 p-3">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        placeholder="Duration (mins)"
                                                        value={testDuration}
                                                        onChange={(e) => setTestDuration(parseInt(e.target.value))}
                                                        className="w-1/2 rounded bg-[#111111] border border-gray-700 px-3 py-1 text-sm"
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Pass %"
                                                        value={testPassingScore}
                                                        onChange={(e) => setTestPassingScore(parseInt(e.target.value))}
                                                        className="w-1/2 rounded bg-[#111111] border border-gray-700 px-3 py-1 text-sm"
                                                    />
                                                </div>

                                                <div className="border-t border-gray-800 pt-2">
                                                    <h4 className="mb-2 text-xs font-bold text-gray-400">Add Problems ({testProblems.length})</h4>
                                                    <div className="space-y-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Problem Title"
                                                            value={tpTitle}
                                                            onChange={(e) => setTpTitle(e.target.value)}
                                                            className="w-full rounded bg-[#111111] border border-gray-700 px-3 py-1 text-sm"
                                                        />
                                                        <textarea
                                                            placeholder="Description"
                                                            value={tpDesc}
                                                            onChange={(e) => setTpDesc(e.target.value)}
                                                            className="w-full h-16 rounded bg-[#111111] border border-gray-700 px-3 py-1 text-sm"
                                                        />
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                placeholder="Input"
                                                                value={tpInput}
                                                                onChange={(e) => setTpInput(e.target.value)}
                                                                className="w-1/2 rounded bg-[#111111] border border-gray-700 px-3 py-1 text-sm"
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="Output"
                                                                value={tpOutput}
                                                                onChange={(e) => setTpOutput(e.target.value)}
                                                                className="w-1/2 rounded bg-[#111111] border border-gray-700 px-3 py-1 text-sm"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={addTestProblem}
                                                            className="w-full rounded bg-gray-800 py-1 text-xs hover:bg-gray-700"
                                                        >
                                                            Add Problem
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <input
                                                type="text"
                                                placeholder="Assignment ID"
                                                value={newItemContent}
                                                onChange={(e) => setNewItemContent(e.target.value)}
                                                className="w-full rounded bg-[#111111] border border-gray-700 px-3 py-1 text-sm"
                                            />
                                        )}

                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setActiveModuleId(null)}
                                                className="text-xs text-gray-400 hover:text-white"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={addItem}
                                                className="rounded bg-blue-600 px-3 py-1 text-xs font-medium hover:bg-blue-700"
                                            >
                                                Add Item
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setActiveModuleId(module.id)}
                                        className="flex w-full items-center justify-center gap-2 rounded border border-dashed border-gray-700 py-2 text-sm text-gray-400 hover:border-gray-500 hover:text-white"
                                    >
                                        <Plus size={14} /> Add Content
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {isAddingModule ? (
                        <div className="rounded-lg border border-gray-800 bg-[#111111] p-6 space-y-4">
                            <h3 className="font-semibold">New Module</h3>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Module Title</label>
                                <input
                                    type="text"
                                    value={newModuleTitle}
                                    onChange={(e) => setNewModuleTitle(e.target.value)}
                                    className="w-full rounded border border-gray-700 bg-[#1e1e1e] px-4 py-2 focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Time Limit (Hours)</label>
                                <input
                                    type="number"
                                    value={newModuleTime}
                                    onChange={(e) => setNewModuleTime(e.target.value)}
                                    className="w-full rounded border border-gray-700 bg-[#1e1e1e] px-4 py-2 focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsAddingModule(false)}
                                    className="px-4 py-2 text-sm text-gray-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={addModule}
                                    className="rounded bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700"
                                >
                                    Create Module
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAddingModule(true)}
                            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-800 py-8 text-gray-400 hover:border-gray-600 hover:text-white"
                        >
                            <Plus size={20} /> Add Module
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
}
