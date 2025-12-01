"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Lock, Unlock, CheckCircle, PlayCircle, FileCode, Clock } from "lucide-react";
import Link from "next/link";

interface ModuleItem {
    id: string;
    title: string;
    type: "VIDEO" | "ASSIGNMENT";
    content?: string;
    assignmentId?: string;
    isCompleted: boolean;
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

                // If it's locked but it's the first one (or previous is completed), we might need to start it?
                // The API should handle unlocking the first module on enrollment.
                // If status is LOCKED but it's the current one, the user needs to click "Start".

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

    const handleEnroll = async () => {
        try {
            const res = await fetch(`/api/courses/${courseId}/enroll`, { method: "POST" });
            if (res.ok) {
                fetchCourseData();
            }
        } catch (error) {
            console.error(error);
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
            const res = await fetch(`/api/items/${itemId}/complete`, { method: "POST" });
            if (res.ok) {
                // Refresh data to check for module completion/unlocks
                fetchCourseData();
            }
        } catch (error) {
            console.error(error);
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
                        className="w-full rounded bg-blue-600 px-6 py-3 font-bold hover:bg-blue-700"
                    >
                        Enroll Now
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
                                            <PlayCircle size={14} />
                                        ) : (
                                            <FileCode size={14} />
                                        )}
                                        <span className="truncate">{item.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
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
                    <div className="mx-auto max-w-4xl">
                        <div className="mb-6 flex items-center justify-between">
                            <h1 className="text-2xl font-bold">{activeItem.title}</h1>
                            {timeLeft && (
                                <div className="flex items-center gap-2 rounded bg-red-900/20 px-3 py-1 text-red-400 border border-red-900/50">
                                    <Clock size={16} />
                                    <span className="font-mono font-bold">{timeLeft}</span>
                                </div>
                            )}
                        </div>

                        <div className="mb-8 rounded-lg border border-gray-800 bg-[#111111] p-6">
                            {activeItem.type === "VIDEO" ? (
                                <div className="aspect-video w-full bg-black">
                                    {/* Video Player Placeholder */}
                                    <iframe
                                        src={activeItem.content?.replace("watch?v=", "embed/")}
                                        className="h-full w-full"
                                        allowFullScreen
                                    />
                                </div>
                            ) : (
                                <div className="text-center">
                                    <p className="mb-4 text-gray-400">This is an assignment task.</p>
                                    <Link
                                        href={`/assignment/${activeItem.assignmentId}`}
                                        className="inline-block rounded bg-blue-600 px-6 py-2 font-medium hover:bg-blue-700"
                                    >
                                        Go to Assignment
                                    </Link>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end">
                            {!activeItem.isCompleted && (
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
