"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Clock, Video, FileCode, GripVertical, Upload, Edit, Brain, Users } from "lucide-react";
import Link from "next/link";
import ProblemBuilder from "@/components/ProblemBuilder";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface ModuleItem {
    id: string;
    title: string;
    type: "VIDEO" | "ASSIGNMENT" | "AI_INTERVIEW" | "TEST" | "WEB_DEV" | "LEETCODE";
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
    const [newItemType, setNewItemType] = useState<"VIDEO" | "ASSIGNMENT" | "AI_INTERVIEW" | "TEST" | "WEB_DEV">("VIDEO");
    const [newItemTitle, setNewItemTitle] = useState("");
    const [newItemContent, setNewItemContent] = useState(""); // URL or Assignment ID
    // const [newItemDuration, setNewItemDuration] = useState(0); // Removed Manual Duration
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    // AI Interview State
    const [aiTopic, setAiTopic] = useState("");
    const [aiCount, setAiCount] = useState(5);
    const [aiDifficulty, setAiDifficulty] = useState("Medium");

    // Test State
    const [testDuration, setTestDuration] = useState(30);
    const [testPassingScore, setTestPassingScore] = useState(60);
    const [testProblems, setTestProblems] = useState<any[]>([]);

    // Assignment State
    const [assignProblems, setAssignProblems] = useState<any[]>([]);

    // Web Dev State
    const [webDevInstructions, setWebDevInstructions] = useState("");
    const [webDevHtml, setWebDevHtml] = useState("");
    const [webDevCss, setWebDevCss] = useState("");
    const [webDevJs, setWebDevJs] = useState("");

    // Problem Builder State
    const [isProblemBuilderOpen, setIsProblemBuilderOpen] = useState(false);
    const [problemBuilderType, setProblemBuilderType] = useState<"TEST" | "ASSIGNMENT">("ASSIGNMENT");

    const openProblemBuilder = (type: "TEST" | "ASSIGNMENT") => {
        setProblemBuilderType(type);
        setIsProblemBuilderOpen(true);
    };

    const handleSaveProblem = (problem: any) => {
        let defaultCode = {};
        if (problem.type === "CODING") {
            defaultCode = {
                python: "# Write your code here",
                cpp: "// Write your code here",
                java: "// Write your code here"
            };
        } else {
            defaultCode = {
                isWebDev: true,
                html: problem.webDevInitialCode?.html || "",
                css: problem.webDevInitialCode?.css || "",
                js: problem.webDevInitialCode?.js || ""
            };
        }

        const newProblem = {
            title: problem.title,
            description: problem.description, // For Web Dev, this contains instructions
            testCases: problem.testCases,
            hints: JSON.stringify(problem.hints), // Ensure hints are stringified
            defaultCode: JSON.stringify(defaultCode),
            videoSolution: problem.videoSolution,
            leetcodeUrl: problem.leetcodeUrl,
            slug: problem.leetcodeUrl
                ? problem.leetcodeUrl.split("/problems/")[1]?.split("/")[0]
                : problem.title.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "")
        };

        if (problemBuilderType === "TEST") {
            setTestProblems([...testProblems, newProblem]);
        } else {
            setAssignProblems([...assignProblems, newProblem]);
        }
        setIsProblemBuilderOpen(false);
    };

    const uploadToS3 = async (file: File, retries = 3): Promise<string> => {
        let presignedData;
        try {
            const res = await fetch("/api/upload/presigned-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type,
                    contentLength: file.size
                })
            });
            if (!res.ok) throw new Error("Failed to get upload URL");
            presignedData = await res.json();
        } catch (err: any) {
            throw new Error(`Failed to setup upload: ${err.message}`);
        }

        const { uploadUrl, publicUrl } = presignedData;
        console.log("Generated Upload URL:", uploadUrl);

        return new Promise<string>((resolve, reject) => {
            const attemptUpload = (retryCount: number) => {
                const xhr = new XMLHttpRequest();
                xhr.open("PUT", uploadUrl);
                xhr.setRequestHeader("Content-Type", file.type);

                let lastProgress = 0;
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percent = Math.round((event.loaded / event.total) * 100);
                        if (percent === 0 || percent === 100 || percent >= lastProgress + 5) {
                            setUploadProgress(percent);
                            lastProgress = percent;
                        }
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(publicUrl);
                    } else {
                        console.error("S3 Upload Error:", xhr.status, xhr.responseText);
                        if (retryCount > 0) {
                            console.log(`Retrying upload... (${retryCount} attempts left)`);
                            setTimeout(() => attemptUpload(retryCount - 1), 1000);
                        } else {
                            reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
                        }
                    }
                };

                xhr.onerror = () => {
                    console.error("S3 Network Error");
                    if (retryCount > 0) {
                        console.log(`Retrying upload... (${retryCount} attempts left)`);
                        setTimeout(() => attemptUpload(retryCount - 1), 1000);
                    } else {
                        reject(new Error("Network error during upload"));
                    }
                };

                xhr.send(file);
            };

            attemptUpload(retries);
        });
    };

    useEffect(() => {
        fetchCourse();
    }, [courseId]);

    const [error, setError] = useState<string | null>(null);

    const fetchCourse = async () => {
        try {
            const res = await fetch(`/api/courses/${courseId}/builder`);
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || `Failed to fetch course: ${res.status}`);
            }
            const data = await res.json();
            setCourse(data);
        } catch (error: any) {
            console.error(error);
            setError(error.message);
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
            if (newItemType === "VIDEO") {
                if (!videoFile) {
                    alert("Please select a video file");
                    return;
                }
                setIsUploading(true);
                try {
                    content = await uploadToS3(videoFile);
                } catch (error: any) {
                    console.error("Upload failed:", error);
                    setIsUploading(false);
                    alert(`Failed to upload video: ${error.message}`);
                    return;
                }
                setIsUploading(false);
            } else if (newItemType === "AI_INTERVIEW") {
                content = JSON.stringify({ topic: aiTopic, count: aiCount, difficulty: aiDifficulty });
            } else if (newItemType === "TEST") {
                content = JSON.stringify({
                    duration: testDuration,
                    passingScore: testPassingScore,
                    problems: testProblems
                });
            } else if (newItemType === "WEB_DEV") {
                let videoUrl = undefined;
                if (videoFile) {
                    setIsUploading(true);
                    try {
                        videoUrl = await uploadToS3(videoFile);
                    } catch (error: any) {
                        console.error("Upload failed:", error);
                        setIsUploading(false);
                        alert(`Failed to upload video: ${error.message}`);
                        return;
                    }
                    setIsUploading(false);
                }
                content = JSON.stringify({
                    instructions: webDevInstructions,
                    initialCode: {
                        html: webDevHtml,
                        css: webDevCss,
                        js: webDevJs
                    },
                    videoSolution: videoUrl
                });
            } else if (newItemType === "ASSIGNMENT") {
                const formData = new FormData();
                formData.append("title", newItemTitle);
                formData.append("problems", JSON.stringify(assignProblems));

                const assignRes = await fetch("/api/assignments", {
                    method: "POST",
                    body: formData,
                });

                if (!assignRes.ok) {
                    const errorData = await assignRes.json();
                    throw new Error(errorData.details || errorData.error || "Failed to create assignment");
                }
                const assignment = await assignRes.json();
                content = assignment.id;
            } else if (newItemType === "LEETCODE") {
                let videoUrl = undefined;
                if (videoFile) {
                    setIsUploading(true);
                    try {
                        videoUrl = await uploadToS3(videoFile);
                    } catch (error: any) {
                        console.error("Upload failed:", error);
                        setIsUploading(false);
                        alert(`Failed to upload video: ${error.message}`);
                        return;
                    }
                    setIsUploading(false);
                }
                content = JSON.stringify({
                    leetcodeUrl: newItemContent,
                    videoSolution: videoUrl
                });
            }

            const res = await fetch(`/api/modules/${activeModuleId}/items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: newItemTitle,
                    type: newItemType,
                    content: content,
                    duration: "0" // Default to 0 for actual tracking
                }),
            });
            if (res.ok) {
                setActiveModuleId(null);
                setNewItemTitle("");
                setNewItemContent("");
                // setNewItemDuration(0);
                setVideoFile(null);
                setAiTopic("");
                setAiCount(5);
                setAiDifficulty("Medium");
                setWebDevInstructions("");
                setWebDevHtml("");
                setWebDevCss("");
                setWebDevJs("");
                setTestProblems([]);
                setAssignProblems([]);
                setUploadProgress(0);
                fetchCourse();
            } else {
                const data = await res.json();
                throw new Error(data.details || data.error || "Failed to add item");
            }
        } catch (error) {
            console.error(error);
            setIsUploading(false);
            // @ts-ignore
            alert(error.message || "Failed to add item");
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

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, type } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        if (type === "module") {
            const newModules = Array.from(course!.modules);
            const [reorderedModule] = newModules.splice(source.index, 1);
            newModules.splice(destination.index, 0, reorderedModule);

            setCourse({ ...course!, modules: newModules });

            const updates = newModules.map((module, index) => ({
                id: module.id,
                order: index,
            }));

            try {
                await fetch(`/api/courses/${courseId}/modules/reorder`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ list: updates }),
                });
            } catch (error) {
                console.error("Failed to reorder modules", error);
            }
        } else if (type === "item") {
            const sourceModuleId = source.droppableId;
            const destModuleId = destination.droppableId;

            if (sourceModuleId !== destModuleId) {
                // Moving items between modules is not supported yet for simplicity
                return;
            }

            const moduleIndex = course!.modules.findIndex(m => m.id === sourceModuleId);
            const newModules = [...course!.modules];
            const newItems = Array.from(newModules[moduleIndex].items);
            const [reorderedItem] = newItems.splice(source.index, 1);
            newItems.splice(destination.index, 0, reorderedItem);

            newModules[moduleIndex] = { ...newModules[moduleIndex], items: newItems };
            setCourse({ ...course!, modules: newModules });

            const updates = newItems.map((item, index) => ({
                id: item.id,
                order: index,
            }));

            try {
                await fetch(`/api/modules/${sourceModuleId}/items/reorder`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ list: updates }),
                });
            } catch (error) {
                console.error("Failed to reorder items", error);
            }
        }
    };

    if (isLoading) return <div className="p-8 text-white">Loading...</div>;
    if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
    if (!course) return <div className="p-8 text-white">Course not found</div>;

    return (
        <div className="min-h-screen bg-[#0e0e0e] text-white">
            {isProblemBuilderOpen && (
                <ProblemBuilder
                    onSave={handleSaveProblem}
                    onCancel={() => setIsProblemBuilderOpen(false)}
                    uploadVideo={uploadToS3}
                    isUploading={isUploading}
                />
            )}

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
                    <Link href={`/teacher/courses/${courseId}/students`}>
                        <button className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors">
                            <Users size={16} />
                            Students
                        </button>
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-4xl p-6">
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="modules" type="module">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="space-y-6"
                            >
                                {course.modules.map((module, index) => (
                                    <Draggable key={module.id} draggableId={module.id} index={index}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className="rounded-lg border border-gray-800 bg-[#111111] overflow-hidden"
                                            >
                                                <div className="flex items-center justify-between bg-[#161616] px-6 py-4 border-b border-gray-800">
                                                    <div className="flex items-center gap-3">
                                                        <div {...provided.dragHandleProps} className="cursor-grab text-gray-500 hover:text-white">
                                                            <GripVertical size={20} />
                                                        </div>
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
                                                    <Droppable droppableId={module.id} type="item">
                                                        {(provided) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.droppableProps}
                                                                className="space-y-3"
                                                            >
                                                                {module.items.map((item, itemIndex) => (
                                                                    <Draggable key={item.id} draggableId={item.id} index={itemIndex}>
                                                                        {(provided) => (
                                                                            <div
                                                                                ref={provided.innerRef}
                                                                                {...provided.draggableProps}
                                                                                {...provided.dragHandleProps}
                                                                                className="flex items-center justify-between rounded border border-gray-800 bg-[#1e1e1e] p-3"
                                                                            >
                                                                                <div className="flex items-center gap-3">
                                                                                    <GripVertical className="text-gray-600 cursor-grab" size={16} />
                                                                                    {item.type === "VIDEO" ? (
                                                                                        <Video size={16} className="text-blue-400" />
                                                                                    ) : item.type === "WEB_DEV" ? (
                                                                                        <FileCode size={16} className="text-orange-400" />
                                                                                    ) : item.type === "LEETCODE" ? (
                                                                                        <FileCode size={16} className="text-green-400" />
                                                                                    ) : item.type === "AI_INTERVIEW" ? (
                                                                                        <Brain size={16} className="text-pink-400" />
                                                                                    ) : item.type === "ASSIGNMENT" ? (
                                                                                        <FileCode size={16} className="text-purple-400" />
                                                                                    ) : (
                                                                                        <FileCode size={16} className="text-gray-400" />
                                                                                    )}
                                                                                    <span className="text-sm">{item.title}</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    {item.type === "ASSIGNMENT" && (
                                                                                        <>
                                                                                            <Link
                                                                                                href={`/teacher/courses/${courseId}/assignments/${item.assignmentId || item.content}/edit`}
                                                                                                className="text-gray-500 hover:text-blue-400"
                                                                                                title="Edit Assignment"
                                                                                            >
                                                                                                <Edit size={14} />
                                                                                            </Link>
                                                                                            <Link
                                                                                                href={`/teacher/courses/${courseId}/assignments/${item.assignmentId || item.content}/submissions`}
                                                                                                className="text-gray-500 hover:text-green-400"
                                                                                                title="View Submissions"
                                                                                            >
                                                                                                <FileCode size={14} />
                                                                                            </Link>
                                                                                        </>
                                                                                    )}
                                                                                    {item.type === "AI_INTERVIEW" && (
                                                                                        <Link
                                                                                            href={`/teacher/courses/${courseId}/interview/${item.id}/submissions`}
                                                                                            className="text-gray-500 hover:text-pink-400"
                                                                                            title="Review Interviews"
                                                                                        >
                                                                                            <Users size={14} />
                                                                                        </Link>
                                                                                    )}
                                                                                    <button
                                                                                        onClick={() => deleteItem(item.id)}
                                                                                        className="text-gray-500 hover:text-red-400"
                                                                                    >
                                                                                        <Trash2 size={14} />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </Draggable>
                                                                ))}
                                                                {provided.placeholder}
                                                            </div>
                                                        )}
                                                    </Droppable>

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
                                                                    <option value="WEB_DEV">Coding Assignment (Web Dev)</option>
                                                                    <option value="LEETCODE">LeetCode Problem</option>
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
                                                                            accept="video/*,.mkv,video/x-matroska"
                                                                            onChange={(e) => {
                                                                                setVideoFile(e.target.files?.[0] || null);
                                                                                if (e.target.files?.[0]) {
                                                                                    setNewItemContent(""); // Clear manual URL if file selected
                                                                                }
                                                                            }}
                                                                            className="hidden"
                                                                            id="video-upload"
                                                                        />
                                                                        {videoFile ? (
                                                                            <div className="w-full space-y-2">
                                                                                <div className="flex items-center justify-between p-4 bg-[#1e1e1e] rounded border border-gray-800">
                                                                                    <span className="text-sm font-medium text-blue-400 truncate max-w-[200px]">{videoFile.name}</span>
                                                                                    <label
                                                                                        htmlFor="video-upload"
                                                                                        className="cursor-pointer text-xs text-gray-400 hover:text-white bg-gray-800 px-2 py-1 rounded"
                                                                                    >
                                                                                        Change
                                                                                    </label>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <label
                                                                                htmlFor="video-upload"
                                                                                className="flex cursor-pointer flex-col items-center gap-2 text-gray-400 hover:text-white"
                                                                            >
                                                                                <Upload className="h-8 w-8" />
                                                                                <span className="text-sm">Click to upload video</span>
                                                                            </label>
                                                                        )}
                                                                    </div>

                                                                    <div className="relative flex items-center py-2">
                                                                        <div className="flex-grow border-t border-gray-800"></div>
                                                                        <span className="flex-shrink-0 mx-4 text-gray-500 text-xs">OR</span>
                                                                        <div className="flex-grow border-t border-gray-800"></div>
                                                                    </div>

                                                                    <div>
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Paste Video URL (YouTube, Vimeo, etc.)"
                                                                            value={newItemContent}
                                                                            onChange={(e) => {
                                                                                setNewItemContent(e.target.value);
                                                                                setVideoFile(null); // Clear file if URL entered
                                                                            }}
                                                                            className="w-full rounded bg-[#111111] border border-gray-700 px-3 py-2 text-sm"
                                                                        />
                                                                    </div>
                                                                    {uploadProgress > 0 && (
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-800">
                                                                                <div
                                                                                    className="h-full bg-blue-500 transition-all duration-300"
                                                                                    style={{ width: `${uploadProgress}%` }}
                                                                                />
                                                                            </div>
                                                                            <span className="text-xs text-gray-400">{uploadProgress}%</span>
                                                                        </div>
                                                                    )}
                                                                    {/* Duration Input Removed */}
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
                                                                        <div className="flex-1">
                                                                            <label className="text-xs text-gray-400 block mb-1">Difficulty</label>
                                                                            <select
                                                                                value={aiDifficulty}
                                                                                onChange={(e) => setAiDifficulty(e.target.value)}
                                                                                className="w-full rounded bg-[#111111] border border-gray-700 px-3 py-1 text-sm"
                                                                            >
                                                                                <option value="Basic">Basic</option>
                                                                                <option value="Easy">Easy</option>
                                                                                <option value="Medium">Medium</option>
                                                                                <option value="Hard">Hard</option>
                                                                            </select>
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-xs text-gray-400 block mb-1">Questions</label>
                                                                            <input
                                                                                type="number"
                                                                                value={aiCount}
                                                                                onChange={(e) => setAiCount(parseInt(e.target.value))}
                                                                                className="w-20 rounded bg-[#111111] border border-gray-700 px-3 py-1 text-sm"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : newItemType === "TEST" ? (
                                                                <div className="space-y-3 rounded border border-gray-800 p-3">
                                                                    <div className="flex gap-2">
                                                                        <div className="w-1/2 space-y-1">
                                                                            <label className="text-xs text-gray-400">Duration (mins)</label>
                                                                            <input
                                                                                type="number"
                                                                                placeholder="Duration (mins)"
                                                                                value={testDuration}
                                                                                onChange={(e) => setTestDuration(parseInt(e.target.value))}
                                                                                className="w-full rounded bg-[#111111] border border-gray-700 px-3 py-1 text-sm"
                                                                            />
                                                                        </div>
                                                                        <div className="w-1/2 space-y-1">
                                                                            <label className="text-xs text-gray-400">Passing Score (%)</label>
                                                                            <input
                                                                                type="number"
                                                                                placeholder="Pass %"
                                                                                value={testPassingScore}
                                                                                onChange={(e) => setTestPassingScore(parseInt(e.target.value))}
                                                                                className="w-full rounded bg-[#111111] border border-gray-700 px-3 py-1 text-sm"
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className="border-t border-gray-800 pt-2">
                                                                        <div className="mb-2 flex items-center justify-between">
                                                                            <h4 className="text-xs font-bold text-gray-400">Problems ({testProblems.length})</h4>
                                                                            <button
                                                                                onClick={() => openProblemBuilder("TEST")}
                                                                                className="flex items-center gap-1 rounded bg-gray-800 px-2 py-1 text-xs hover:bg-gray-700"
                                                                            >
                                                                                <Plus size={12} /> Add Problem
                                                                            </button>
                                                                        </div>
                                                                        {testProblems.map((p, i) => (
                                                                            <div key={i} className="text-sm bg-[#111111] p-2 rounded mb-1 border border-gray-800">
                                                                                <span className="font-bold">{p.title}</span>
                                                                                <p className="text-xs text-gray-500 truncate">{p.description}</p>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ) : newItemType === "WEB_DEV" ? (
                                                                <div className="space-y-3 rounded border border-gray-800 p-3">
                                                                    <div className="space-y-2">
                                                                        <label className="text-xs text-gray-400">Instructions</label>
                                                                        <textarea
                                                                            value={webDevInstructions}
                                                                            onChange={(e) => setWebDevInstructions(e.target.value)}
                                                                            className="w-full rounded bg-[#111111] border border-gray-700 px-3 py-2 text-sm h-24"
                                                                            placeholder="Enter assignment instructions..."
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <label className="text-xs text-gray-400">Initial HTML</label>
                                                                        <textarea
                                                                            value={webDevHtml}
                                                                            onChange={(e) => setWebDevHtml(e.target.value)}
                                                                            className="w-full rounded bg-[#111111] border border-gray-700 px-3 py-2 text-sm font-mono h-20"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <label className="text-xs text-gray-400">Initial CSS</label>
                                                                        <textarea
                                                                            value={webDevCss}
                                                                            onChange={(e) => setWebDevCss(e.target.value)}
                                                                            className="w-full rounded bg-[#111111] border border-gray-700 px-3 py-2 text-sm font-mono h-20"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <label className="text-xs text-gray-400">Initial JS</label>
                                                                        <textarea
                                                                            value={webDevJs}
                                                                            onChange={(e) => setWebDevJs(e.target.value)}
                                                                            className="w-full rounded bg-[#111111] border border-gray-700 px-3 py-2 text-sm font-mono h-20"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ) : newItemType === "ASSIGNMENT" ? (
                                                                <div className="space-y-3 rounded border border-gray-800 p-3">
                                                                    <div className="border-t border-gray-800 pt-2">
                                                                        <div className="mb-2 flex items-center justify-between">
                                                                            <h4 className="text-xs font-bold text-gray-400">Problems ({assignProblems.length})</h4>
                                                                            <button
                                                                                onClick={() => openProblemBuilder("ASSIGNMENT")}
                                                                                className="flex items-center gap-1 rounded bg-gray-800 px-2 py-1 text-xs hover:bg-gray-700"
                                                                            >
                                                                                <Plus size={12} /> Add Problem
                                                                            </button>
                                                                        </div>
                                                                        {assignProblems.map((p, i) => (
                                                                            <div key={i} className="text-sm bg-[#111111] p-2 rounded mb-1 border border-gray-800">
                                                                                <span className="font-bold">{p.title}</span>
                                                                                <p className="text-xs text-gray-500 truncate">{p.description}</p>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ) : newItemType === "LEETCODE" ? (
                                                                <div className="space-y-3 rounded border border-gray-800 p-3">
                                                                    <div className="space-y-2">
                                                                        <label className="text-xs text-gray-400">LeetCode Problem URL</label>
                                                                        <input
                                                                            type="text"
                                                                            placeholder="https://leetcode.com/problems/..."
                                                                            value={newItemContent}
                                                                            onChange={(e) => setNewItemContent(e.target.value)}
                                                                            className="w-full rounded bg-[#111111] border border-gray-700 px-3 py-2 text-sm"
                                                                        />
                                                                        <p className="text-xs text-gray-500">
                                                                            Paste the full URL of the LeetCode problem.
                                                                        </p>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <label className="text-xs text-gray-400">Solution Video (Optional)</label>
                                                                        <div className="flex flex-col items-center justify-center rounded border-2 border-dashed border-gray-700 bg-[#111111] p-6">
                                                                            <input
                                                                                type="file"
                                                                                accept="video/*,.mkv,video/x-matroska"
                                                                                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                                                                                className="hidden"
                                                                                id="leetcode-video-upload"
                                                                            />
                                                                            {videoFile ? (
                                                                                <div className="w-full space-y-2">
                                                                                    <video
                                                                                        src={URL.createObjectURL(videoFile)}
                                                                                        controls
                                                                                        className="max-h-[200px] w-full rounded bg-black"
                                                                                    />
                                                                                    <div className="flex items-center justify-between">
                                                                                        <span className="text-sm font-medium text-blue-400">{videoFile.name}</span>
                                                                                        <label
                                                                                            htmlFor="leetcode-video-upload"
                                                                                            className="cursor-pointer text-xs text-gray-400 hover:text-white"
                                                                                        >
                                                                                            Change
                                                                                        </label>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <label
                                                                                    htmlFor="leetcode-video-upload"
                                                                                    className="flex cursor-pointer flex-col items-center gap-2 text-gray-400 hover:text-white"
                                                                                >
                                                                                    <Upload className="h-6 w-6" />
                                                                                    <span className="text-xs">Upload Solution Video</span>
                                                                                </label>
                                                                            )}
                                                                        </div>
                                                                        {uploadProgress > 0 && (
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-800">
                                                                                    <div
                                                                                        className="h-full bg-blue-500 transition-all duration-300"
                                                                                        style={{ width: `${uploadProgress}%` }}
                                                                                    />
                                                                                </div>
                                                                                <span className="text-xs text-gray-400">{uploadProgress}%</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ) : null}

                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    onClick={() => setActiveModuleId(null)}
                                                                    className="text-xs text-gray-400 hover:text-white"
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    onClick={addItem}
                                                                    disabled={isUploading}
                                                                    className="rounded bg-blue-600 px-3 py-1 text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    {isUploading ? "Uploading..." : "Add Item"}
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
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>

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

                </DragDropContext>
            </main >
        </div >
    );
}
