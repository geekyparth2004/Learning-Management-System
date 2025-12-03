"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Lock, Unlock, CheckCircle, PlayCircle, FileCode, Clock, Video, Brain, Code, FileText, Layout } from "lucide-react";
import Link from "next/link";
import AIInterviewPlayer from "@/components/AIInterviewPlayer";
import TestPlayer from "@/components/TestPlayer";
import WebDevPlayer from "@/components/WebDevPlayer";

import CodeEditor from "@/components/CodeEditor";
import Console from "@/components/Console";
import { Language } from "@/types";

interface ModuleItem {
    id: string;
    title: string;
    type: "VIDEO" | "ASSIGNMENT" | "AI_INTERVIEW" | "TEST" | "WEB_DEV";
    content?: string;
    assignmentId?: string;
    isCompleted: boolean;
    aiInterviewTopic?: string;
    aiQuestionsCount?: number;
    aiDifficulty?: string;
    reviewStatus?: string;
    testDuration?: number;
    testPassingScore?: number;
    testProblems?: any[];
    webDevInstructions?: string;
    webDevInitialCode?: any;
    webDevSubmission?: any;
}

interface Module {
    id: string;
    title: string;
    timeLimit: number;
    items: ModuleItem[];
    status: "LOCKED" | "IN_PROGRESS" | "COMPLETED";
    startedAt?: string;
    completedAt?: string;
}

interface CourseData {
    id: string;
    title: string;
    description: string;
    isEnrolled: boolean;
    modules: Module[];
}

export default function CoursePlayerPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.id as string;
    const [course, setCourse] = useState<CourseData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
    const [activeItemId, setActiveItemId] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<string>("");

    // Practice Mode State
    const [showPractice, setShowPractice] = useState(false);
    const [practiceCode, setPracticeCode] = useState("");
    const [practiceLanguage, setPracticeLanguage] = useState<Language>("python");
    const [practiceOutput, setPracticeOutput] = useState("");
    const [customInput, setCustomInput] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [runStatus, setRunStatus] = useState<"idle" | "running" | "success" | "error">("idle");

    // Split View State
    const [splitRatio, setSplitRatio] = useState(65); // Default 65% for video
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const startResizing = () => setIsResizing(true);
    const stopResizing = () => setIsResizing(false);

    const resize = (e: MouseEvent) => {
        if (isResizing && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const newRatio = ((e.clientX - containerRect.left) / containerRect.width) * 100;
            if (newRatio > 20 && newRatio < 80) { // Min/Max constraints
                setSplitRatio(newRatio);
            }
        }
    };

    useEffect(() => {
        if (isResizing) {
            window.addEventListener("mousemove", resize);
            window.addEventListener("mouseup", stopResizing);
        } else {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        }
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [isResizing]);

    useEffect(() => {
        fetchCourseData();
    }, [courseId]);

    // Timer Logic
    useEffect(() => {
        if (!course || !activeModuleId) return;

        const module = course.modules.find(m => m.id === activeModuleId);
        if (!module || module.status !== "IN_PROGRESS" || !module.startedAt) {
            setTimeLeft("");
            return;
        }

        const interval = setInterval(() => {
            const startTime = new Date(module.startedAt!).getTime();
            const endTime = startTime + module.timeLimit * 60 * 1000;
            const now = new Date().getTime();
            const diff = endTime - now;

            if (diff <= 0) {
                setTimeLeft("Time Expired");
                clearInterval(interval);
            } else {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                setTimeLeft(`${hours}h ${minutes}m remaining`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [course, activeModuleId]);

    const fetchCourseData = async () => {
        try {
            const res = await fetch(`/api/courses/${courseId}/player`);
            if (!res.ok) throw new Error("Failed to fetch course");
            const data = await res.json();
            setCourse(data);

            // Set active module/item if enrolled
            if (data.isEnrolled && data.modules.length > 0) {
                // Find first in-progress or first locked (if none in progress)
                const currentModule = data.modules.find((m: Module) => m.status === "IN_PROGRESS")
                    || data.modules.find((m: Module) => m.status === "LOCKED")
                    || data.modules[0];

                setActiveModuleId(currentModule.id);
                if (currentModule.items.length > 0) {
                    setActiveItemId(currentModule.items[0].id);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const [isEnrolling, setIsEnrolling] = useState(false);

    const handleEnroll = async () => {
        setIsEnrolling(true);
        try {
            const res = await fetch(`/api/courses/${courseId}/enroll`, { method: "POST" });
            const data = await res.json();

            if (res.ok) {
                if (data.message === "Already enrolled") {
                    // Just refresh data to be sure
                    await fetchCourseData();
                } else {
                    // Success
                    await fetchCourseData();
                }
            } else {
                alert(data.details || data.error || "Failed to enroll");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred while enrolling");
        } finally {
            setIsEnrolling(false);
        }
    };

    const startModule = async (moduleId: string) => {
        try {
            const res = await fetch(`/api/modules/${moduleId}/start`, { method: "POST" });
            if (res.ok) {
                fetchCourseData();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const completeItem = async (itemId: string) => {
        try {
            const res = await fetch(`/api/modules/items/${itemId}/complete`, { method: "POST" });
            if (res.ok) {
                fetchCourseData();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const submitInterviewReview = async (itemId: string, messages: any[]) => {
        try {
            const res = await fetch(`/api/modules/items/${itemId}/review`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages }),
            });
            if (res.ok) {
                fetchCourseData();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const submitWebDev = async (itemId: string, submission: any) => {
        try {
            const res = await fetch(`/api/modules/items/${itemId}/submit-web`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(submission),
            });
            if (res.ok) {
                fetchCourseData();
                alert("Assignment Submitted Successfully!");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to submit assignment");
        }
    };

    const runPracticeCode = async () => {
        setIsRunning(true);
        setRunStatus("running");
        setPracticeOutput("");
        try {
            const res = await fetch("/api/compile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: practiceCode,
                    language: practiceLanguage,
                    input: customInput,
                }),
            });
            const data = await res.json();
            if (data.error) {
                setRunStatus("error");
                setPracticeOutput(data.error);
            } else {
                setRunStatus("success");
                setPracticeOutput(data.output || "No output");
            }
        } catch (error) {
            setRunStatus("error");
            setPracticeOutput("Failed to run code");
        } finally {
            setIsRunning(false);
        }
    };

    const savePracticeCode = async () => {
        if (!activeModuleId) return;
        try {
            const res = await fetch(`/api/courses/${courseId}/modules/${activeModuleId}/practice-save`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: practiceCode,
                    language: practiceLanguage,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                alert("Code saved to GitHub!");
                setPracticeCode(""); // Reset code
            } else {
                alert(data.error || "Failed to save code");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to save code");
        }
    };

    if (isLoading) return <div className="p-8 text-white">Loading...</div>;
    if (!course) return <div className="p-8 text-white">Course not found</div>;

    if (!course.isEnrolled) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0e0e0e] text-white">
                <div className="max-w-md space-y-6 rounded-lg border border-gray-800 bg-[#111111] p-8 text-center">
                    <h1 className="text-2xl font-bold">{course.title}</h1>
                    <p className="text-gray-400">{course.description}</p>
                    <button
                        onClick={handleEnroll}
                        disabled={isEnrolling}
                        className="w-full rounded bg-blue-600 px-6 py-3 font-bold hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isEnrolling ? "Enrolling..." : "Enroll Now"}
                    </button>
                </div>
            </div>
        );
    }

    const activeModule = course.modules.find(m => m.id === activeModuleId);
    const activeItem = activeModule?.items.find(i => i.id === activeItemId);

    return (
        <div className="flex h-screen bg-[#0e0e0e] text-white">
            {/* Sidebar */}
            {!showPractice && activeItem?.type !== "WEB_DEV" && (
                <aside className="w-80 overflow-y-auto border-r border-gray-800 bg-[#111111]">
                    <div className="border-b border-gray-800 p-4">
                        <Link href="/courses" className="mb-2 block text-xs text-gray-500 hover:text-white">
                            ← Back to Courses
                        </Link>
                        <h2 className="font-bold">{course.title}</h2>
                    </div>
                    <div className="p-4">
                        {course.modules.map((module, idx) => (
                            <div key={module.id} className="mb-6">
                                <div className="mb-2 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-300">
                                        Module {idx + 1}: {module.title}
                                    </h3>
                                    {module.status === "LOCKED" ? (
                                        <Lock size={14} className="text-gray-600" />
                                    ) : module.status === "COMPLETED" ? (
                                        <CheckCircle size={14} className="text-green-500" />
                                    ) : (
                                        <Unlock size={14} className="text-blue-500" />
                                    )}
                                </div>

                                <div className="space-y-1">
                                    {module.items.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                if (module.status !== "LOCKED") {
                                                    setActiveModuleId(module.id);
                                                    setActiveItemId(item.id);
                                                }
                                            }}
                                            disabled={module.status === "LOCKED"}
                                            className={`flex w-full items-center gap-3 rounded px-3 py-2 text-sm transition-colors ${activeItemId === item.id && activeModuleId === module.id
                                                ? "bg-blue-900/30 text-blue-400"
                                                : "text-gray-400 hover:bg-[#1e1e1e] hover:text-white"
                                                } ${module.status === "LOCKED" ? "cursor-not-allowed opacity-50" : ""}`}
                                        >
                                            {item.isCompleted ? (
                                                <CheckCircle size={14} className="text-green-500" />
                                            ) : item.type === "VIDEO" ? (
                                                <Video size={16} className="text-blue-400" />
                                            ) : item.type === "AI_INTERVIEW" ? (
                                                <Brain size={16} className="text-pink-400" />
                                            ) : item.type === "TEST" ? (
                                                <Code size={16} className="text-yellow-400" />
                                            ) : item.type === "WEB_DEV" ? (
                                                <Layout size={16} className="text-orange-400" />
                                            ) : (
                                                <FileText size={16} className="text-purple-400" />
                                            )}
                                            <span className="truncate">{item.title}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>
            )}

            {/* Main Content */}
            <main className={`flex-1 overflow-y-auto ${showPractice || activeItem?.type === "WEB_DEV" ? "p-0" : "p-8"}`}>
                {activeModule && activeModule.status === "LOCKED" ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                        <Lock size={48} className="mb-4 text-gray-600" />
                        <h2 className="text-xl font-bold">Module Locked</h2>
                        <p className="text-gray-400">Complete the previous module to unlock this one.</p>
                    </div>
                ) : activeModule && activeModule.status === "IN_PROGRESS" && !activeModule.startedAt ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                        <h2 className="text-xl font-bold mb-4">{activeModule.title}</h2>
                        <p className="text-gray-400 mb-6">You have {Math.round(activeModule.timeLimit / 60)} hours to complete this module once started.</p>
                        <button
                            onClick={() => startModule(activeModule.id)}
                            className="rounded bg-blue-600 px-6 py-3 font-bold hover:bg-blue-700"
                        >
                            Start Module & Timer
                        </button>
                    </div>
                ) : activeItem ? (
                    <div className={`mx-auto h-full flex flex-col ${showPractice ? "max-w-full p-4" : "max-w-4xl"}`}>
                        <div className="mb-6 flex items-center justify-between">
                            <h1 className="text-2xl font-bold">{activeItem.title}</h1>
                            <div className="flex items-center gap-4">
                                {activeItem.type === "VIDEO" && (
                                    <button
                                        onClick={() => setShowPractice(!showPractice)}
                                        className={`flex items-center gap-2 rounded px-3 py-1 text-sm font-medium transition-colors ${showPractice ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
                                            }`}
                                    >
                                        <Code size={16} />
                                        {showPractice ? "Hide Practice" : "Practice Mode"}
                                    </button>
                                )}
                                {timeLeft && (
                                    <div className="flex items-center gap-2 rounded bg-red-900/20 px-3 py-1 text-red-400 border border-red-900/50">
                                        <Clock size={16} />
                                        <span className="font-mono font-bold">{timeLeft}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div
                            ref={containerRef}
                            className={`mb-8 flex-1 overflow-hidden ${showPractice ? "flex gap-4" : ""}`}
                        >
                            <div
                                className={`rounded-lg border border-gray-800 bg-[#111111] overflow-hidden`}
                                style={{ width: showPractice ? `${splitRatio}%` : "100%" }}
                            >
                                {activeItem.type === "VIDEO" ? (
                                    <div className="h-full w-full bg-black flex items-center justify-center">
                                        {activeItem.content?.includes("cloudinary.com") ? (
                                            <video
                                                src={activeItem.content}
                                                controls
                                                playsInline
                                                className="max-h-full max-w-full object-contain"
                                            />
                                        ) : (
                                            <iframe
                                                src={activeItem.content?.replace("watch?v=", "embed/")}
                                                className="h-full w-full"
                                                allowFullScreen
                                            />
                                        )}
                                    </div>
                                ) : activeItem.type === "AI_INTERVIEW" ? (
                                    <div className="h-full w-full overflow-y-auto bg-[#0e0e0e]">
                                        <AIInterviewPlayer
                                            topic={activeItem.aiInterviewTopic || "General"}
                                            questionCountLimit={activeItem.aiQuestionsCount || 5}
                                            difficulty={activeItem.aiDifficulty}
                                            reviewStatus={activeItem.reviewStatus}
                                            onComplete={() => completeItem(activeItem.id)}
                                            onSubmitReview={(messages) => submitInterviewReview(activeItem.id, messages)}
                                        />
                                    </div>
                                ) : activeItem.type === "TEST" ? (
                                    <div className="h-full w-full overflow-hidden bg-[#0e0e0e]">
                                        <TestPlayer
                                            duration={activeItem.testDuration || 30}
                                            passingScore={activeItem.testPassingScore || 60}
                                            problems={activeItem.testProblems || []}
                                            onComplete={(passed, score) => {
                                                if (passed) {
                                                    alert(`Test Passed! Score: ${score.toFixed(1)}%`);
                                                    completeItem(activeItem.id);
                                                } else {
                                                    alert(`Test Failed. Score: ${score.toFixed(1)}%. You need ${activeItem.testPassingScore}% to pass.`);
                                                }
                                            }}
                                        />
                                    </div>
                                ) : activeItem.type === "ASSIGNMENT" ? (
                                    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                                        <FileText className="h-16 w-16 text-gray-600" />
                                        <h2 className="text-xl font-bold">Coding Assignment</h2>
                                        <p className="text-gray-400">
                                            This module contains a coding assignment. Click below to start.
                                        </p>
                                        <Link
                                            href={`/assignment/${activeItem.assignmentId}`}
                                            className="rounded-full bg-blue-600 px-8 py-3 font-bold hover:bg-blue-700"
                                        >
                                            Start Assignment
                                        </Link>
                                    </div>
                                ) : activeItem.type === "WEB_DEV" ? (
                                    <div className="h-full w-full overflow-hidden bg-[#0e0e0e]">
                                        <WebDevPlayer
                                            instructions={activeItem.webDevInstructions || ""}
                                            initialCode={typeof activeItem.webDevInitialCode === 'string' ? JSON.parse(activeItem.webDevInitialCode) : { html: "", css: "", js: "" }}
                                            savedSubmission={typeof activeItem.webDevSubmission === 'string' ? JSON.parse(activeItem.webDevSubmission) : undefined}
                                            onComplete={(submission) => submitWebDev(activeItem.id, submission)}
                                            onBack={() => setActiveItemId(null)}
                                        />
                                    </div>
                                ) : null}
                            </div>

                            {showPractice && activeItem.type === "VIDEO" && (
                                <>
                                    {/* Drag Handle */}
                                    <div
                                        className="w-1 cursor-col-resize bg-gray-800 hover:bg-blue-500 transition-colors rounded"
                                        onMouseDown={startResizing}
                                    />

                                    <div
                                        className="flex flex-col gap-4"
                                        style={{ width: `calc(${100 - splitRatio}% - 1rem)` }} // Subtract gap
                                    >
                                        <div className="flex-1 overflow-hidden rounded-lg border border-gray-800 bg-[#1e1e1e]">
                                            <div className="flex items-center justify-between border-b border-gray-700 bg-[#111111] px-4 py-2">
                                                <select
                                                    value={practiceLanguage}
                                                    onChange={(e) => setPracticeLanguage(e.target.value as Language)}
                                                    className="rounded bg-[#1e1e1e] px-2 py-1 text-xs text-white focus:outline-none"
                                                >
                                                    <option value="python">Python</option>
                                                    <option value="cpp">C++</option>
                                                    <option value="java">Java</option>
                                                </select>
                                                <button
                                                    onClick={runPracticeCode}
                                                    disabled={isRunning}
                                                    className="rounded bg-green-600 px-3 py-1 text-xs font-bold hover:bg-green-700 disabled:opacity-50"
                                                >
                                                    {isRunning ? "Running..." : "Run Code"}
                                                </button>
                                                <button
                                                    onClick={savePracticeCode}
                                                    className="ml-2 rounded bg-purple-600 px-3 py-1 text-xs font-bold hover:bg-purple-700"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                            <div className="h-[calc(100%-40px)]">
                                                <CodeEditor
                                                    language={practiceLanguage}
                                                    code={practiceCode}
                                                    onChange={(val) => setPracticeCode(val || "")}
                                                />
                                            </div>
                                        </div>
                                        <div className="h-1/3 overflow-hidden rounded-lg border border-gray-800 bg-[#111111]">
                                            <Console
                                                output={practiceOutput}
                                                status={runStatus}
                                                onInput={setCustomInput}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex justify-end pb-8">
                            {!activeItem.isCompleted && activeItem.type === "VIDEO" && (
                                <button
                                    onClick={() => completeItem(activeItem.id)}
                                    className="rounded bg-green-600 px-6 py-2 font-medium hover:bg-green-700"
                                >
                                    Mark as Completed
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-400">Select an item to view</div>
                )}
            </main>
        </div>
    );
}
