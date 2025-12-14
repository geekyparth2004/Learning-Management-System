"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Lock, Unlock, CheckCircle, PlayCircle, FileCode, Clock, Video, Brain, Code, FileText, Layout } from "lucide-react";
import Link from "next/link";
import AIInterviewPlayer from "@/components/AIInterviewPlayer";
import TestPlayer from "@/components/TestPlayer";
import WebDevPlayer from "@/components/WebDevPlayer";
import LeetCodeVerifier from "@/components/LeetCodeVerifier";

import CodeEditor from "@/components/CodeEditor";
import Console from "@/components/Console";
import { Language } from "@/types";

interface ModuleItem {
    id: string;
    title: string;
    type: "VIDEO" | "ASSIGNMENT" | "AI_INTERVIEW" | "TEST" | "WEB_DEV" | "LEETCODE";
    content?: string;
    assignmentId?: string;
    isCompleted: boolean;
    startedAt?: string;
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
    leetcodeUrl?: string;
    assignment?: {
        problems: {
            leetcodeUrl?: string;
            slug?: string;
            videoSolution?: string;
        }[];
    }
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
    const [isWebDevFullScreen, setIsWebDevFullScreen] = useState(false);
    const [isTestFullScreen, setIsTestFullScreen] = useState(false);
    const [lastTestResult, setLastTestResult] = useState<{ passed: boolean; score: number } | null>(null);

    // Web Dev Practice State
    const [practiceType, setPracticeType] = useState<"dsa" | "web">("dsa");
    const [webFiles, setWebFiles] = useState([
        { name: "index.html", language: "html", content: "<!-- HTML goes here -->\n<h1>Hello User</h1>" },
        { name: "styles.css", language: "css", content: "/* CSS goes here */\nbody {\n  color: white;\n  background: #111;\n  font-family: sans-serif;\n}" },
        { name: "script.js", language: "javascript", content: "// JavaScript goes here\nconsole.log('Hello from JS');" }
    ]);
    const [activeWebFile, setActiveWebFile] = useState("index.html");
    const [webSrcDoc, setWebSrcDoc] = useState("");

    // Generate srcDoc for Web Dev
    useEffect(() => {
        const html = webFiles.find(f => f.name === "index.html")?.content || "";
        const css = webFiles.find(f => f.name === "styles.css")?.content || "";
        const js = webFiles.find(f => f.name === "script.js")?.content || "";

        setWebSrcDoc(`
            <!DOCTYPE html>
            <html>
                <head>
                    <style>
                        ${css}
                    </style>
                </head>
                <body>
                    ${html}
                    <script>
                        try {
                            ${js}
                        } catch(e) {
                            console.error(e);
                        }
                    </script>
                </body>
            </html>
        `);
    }, [webFiles]);

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

    const [signedVideoUrl, setSignedVideoUrl] = useState<string | null>(null);
    const [signedSolutionUrl, setSignedSolutionUrl] = useState<string | null>(null);
    const activeModule = course?.modules.find(m => m.id === activeModuleId);
    const activeItem = activeModule?.items.find(i => i.id === activeItemId);

    useEffect(() => {
        const fetchSignedUrl = async () => {
            // Check if pre-signed URL is available
            if ((activeItem as any)?.signedUrl) {
                setSignedVideoUrl((activeItem as any).signedUrl);
            }
            // Sign main video content if not pre-signed
            else if (activeItem?.type === "VIDEO" && activeItem.content && !activeItem.content.includes("cloudinary.com") && !activeItem.content.includes("youtube")) {
                try {
                    const res = await fetch("/api/video/sign", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ url: activeItem.content })
                    });
                    const data = await res.json();
                    if (data.signedUrl) {
                        setSignedVideoUrl(data.signedUrl);
                    }
                } catch (e) {
                    console.error("Failed to sign video URL", e);
                }
            } else {
                setSignedVideoUrl(null);
            }

            // Sign solution video content
            const solutionUrl = activeItem?.type === "LEETCODE"
                ? activeItem?.assignment?.problems?.[0]?.videoSolution
                : activeItem?.type === "WEB_DEV"
                    ? activeItem?.content
                    : null;

            if (solutionUrl && !solutionUrl.includes("cloudinary.com") && !solutionUrl.includes("youtube")) {
                try {
                    const res = await fetch("/api/video/sign", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ url: solutionUrl })
                    });
                    const data = await res.json();
                    if (data.signedUrl) {
                        setSignedSolutionUrl(data.signedUrl);
                    }
                } catch (e) {
                    console.error("Failed to sign solution URL", e);
                }
            } else {
                setSignedSolutionUrl(null);
            }
        };
        fetchSignedUrl();
    }, [activeItem?.id, activeItem?.content, activeItem?.type, (activeItem as any)?.signedUrl]);

    // Video Watch Time Tracking
    const [accumulatedTime, setAccumulatedTime] = useState(0);
    const lastTimeRef = useRef(0);

    const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
        const currentTime = e.currentTarget.currentTime;
        if (currentTime > lastTimeRef.current && currentTime - lastTimeRef.current < 2) {
            setAccumulatedTime(prev => prev + (currentTime - lastTimeRef.current));
        }
        lastTimeRef.current = currentTime;
    };

    const saveVideoProgress = async () => {
        if (accumulatedTime < 1) return;
        try {
            if (activeItem) {
                await completeItem(activeItem.id, Math.floor(accumulatedTime), true, false);
                setAccumulatedTime(0);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (accumulatedTime > 0) {
            const timer = setTimeout(saveVideoProgress, 30000);
            return () => clearTimeout(timer);
        }
    }, [accumulatedTime]);

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

    // Force update for LeetCode timer
    const [_, setTick] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchCourseData = async () => {
        if (!courseId) {
            console.log("No courseId, skipping fetch");
            return;
        }
        console.log("Fetching course data for:", courseId);
        try {
            const res = await fetch(`/api/courses/${courseId}/player`);
            console.log("Fetch response status:", res.status);
            if (!res.ok) {
                const text = await res.text();
                console.error("Fetch failed:", text);
                throw new Error("Failed to fetch course");
            }
            const data = await res.json();
            console.log("Course data received:", data);
            setCourse(data);

            // Set active module/item if enrolled
            // Set active module/item if enrolled and NONE selected (initial load)
            if (data.isEnrolled && data.modules.length > 0 && !activeItemId) {
                // Find first in-progress or first locked (if none in progress)
                const currentModule = data.modules.find((m: Module) => m.status === "IN_PROGRESS")
                    || data.modules.find((m: Module) => m.status === "LOCKED")
                    || data.modules[0];

                if (!activeModuleId) {
                    setActiveModuleId(currentModule.id);
                }

                if (currentModule.items.length > 0) {
                    setActiveItemId(currentModule.items[0].id);
                    setIsWebDevFullScreen(false);
                    setIsTestFullScreen(false);
                }
            }
        } catch (error) {
            console.error("Error in fetchCourseData:", error);
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

    const completeItem = async (itemId: string, duration?: number, increment = false, completed = true) => {
        try {
            const body = JSON.stringify({ duration, increment, completed });
            const res = await fetch(`/api/modules/items/${itemId}/complete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body
            });
            if (res.ok) {
                if (res.ok) {
                    fetchCourseData();
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    // ... inside render:
    const submitInterviewReview = async (itemId: string, messages: any, duration: number) => {
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
                    videoTitle: activeItem?.title || "Practice",
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



    console.log("Active Item:", activeItem);
    if (activeItem?.type === "ASSIGNMENT") {
        console.log("Assignment Problems:", activeItem.assignment?.problems);
        console.log("LeetCode URL:", activeItem.assignment?.problems?.[0]?.leetcodeUrl);
    }

    return (
        <div className="flex h-screen bg-[#0e0e0e] text-white">
            {/* Sidebar */}
            {!showPractice && !isWebDevFullScreen && !isTestFullScreen && (
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
                                                    setIsWebDevFullScreen(false);
                                                    setIsTestFullScreen(false);
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
                                            ) : item.type === "LEETCODE" ? (
                                                <Code size={16} className="text-green-400" />
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
            <main className={`flex-1 overflow-y-auto ${showPractice || isWebDevFullScreen || isTestFullScreen ? "p-0" : "p-8"}`}>
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
                    <div className={`mx-auto h-full flex flex-col ${showPractice || isWebDevFullScreen || isTestFullScreen ? "max-w-full" : "max-w-4xl"}`}>
                        {!isWebDevFullScreen && !isTestFullScreen && (
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
                        )}

                        <div
                            ref={containerRef}
                            className={`flex-1 overflow-hidden ${!isWebDevFullScreen && !isTestFullScreen ? "mb-8" : ""} ${showPractice ? "flex gap-4" : ""}`}
                        >
                            <div
                                className={`overflow-hidden bg-[#111111] ${isWebDevFullScreen || isTestFullScreen ? "h-full border-0 rounded-none" : "h-full rounded-lg border border-gray-800"}`}
                                style={{ width: showPractice ? `${splitRatio}%` : "100%" }}
                            >
                                {activeItem.type === "VIDEO" ? (
                                    <div className="h-full w-full bg-black flex items-center justify-center">
                                        {(() => {
                                            const isCloudinary = activeItem.content?.includes("cloudinary.com");
                                            const isR2 = activeItem.content?.includes("r2.cloudflarestorage.com") || activeItem.content?.includes("backblazeb2.com");
                                            const isMp4 = activeItem.content?.endsWith(".mp4");
                                            const needsSigning = !isCloudinary && !activeItem.content?.includes("youtube");

                                            if (needsSigning && !signedVideoUrl) {
                                                return (
                                                    <div className="flex flex-col items-center justify-center gap-4 text-gray-400">
                                                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-600 border-t-blue-500" />
                                                        <p className="text-sm">Loading secure video...</p>
                                                    </div>
                                                );
                                            }

                                            if (isCloudinary || isR2 || isMp4 || needsSigning) {
                                                return (
                                                    <video
                                                        src={signedVideoUrl || activeItem.content}
                                                        controls
                                                        preload="auto"
                                                        playsInline
                                                        className="max-h-full max-w-full object-contain"
                                                        onTimeUpdate={handleVideoTimeUpdate}
                                                        onPause={saveVideoProgress}
                                                        onEnded={() => {
                                                            saveVideoProgress();
                                                            completeItem(activeItem.id);
                                                        }}
                                                    />
                                                );
                                            }

                                            return null; // Fallback handled by iframe check below
                                        })() || (
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
                                            onSubmitReview={(messages, duration) => submitInterviewReview(activeItem.id, messages, duration)}
                                        />
                                    </div>
                                ) : activeItem.type === "TEST" ? (
                                    !isTestFullScreen ? (
                                        <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                                            <Code className="h-16 w-16 text-yellow-400" />
                                            <h2 className="text-xl font-bold">Coding Test</h2>

                                            {lastTestResult && (
                                                <div className={`mb-2 rounded-lg border px-6 py-3 ${lastTestResult.passed
                                                    ? "border-green-900 bg-green-900/20 text-green-400"
                                                    : "border-red-900 bg-red-900/20 text-red-400"
                                                    }`}>
                                                    <p className="font-bold text-lg">{lastTestResult.passed ? "Test Passed!" : "Test Failed"}</p>
                                                    <p>Score: {lastTestResult.score.toFixed(1)}%</p>
                                                    {!lastTestResult.passed && (
                                                        <p className="text-sm opacity-80 mt-1">
                                                            Required: {activeItem.testPassingScore || 60}%
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            <p className="text-gray-400">
                                                You have {activeItem.testDuration || 30} minutes to complete this test.
                                                <br />
                                                Passing Score: {activeItem.testPassingScore || 60}%
                                            </p>
                                            <button
                                                onClick={() => {
                                                    setIsTestFullScreen(true);
                                                    document.documentElement.requestFullscreen().catch(err => console.error(err));
                                                }}
                                                className="rounded-full bg-blue-600 px-8 py-3 font-bold hover:bg-blue-700 transition-colors"
                                            >
                                                {lastTestResult && !lastTestResult.passed ? "Try Again" : "Start Test"}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="h-full w-full overflow-hidden bg-[#0e0e0e]">
                                            <TestPlayer
                                                duration={activeItem.testDuration || 30}
                                                passingScore={activeItem.testPassingScore || 60}
                                                problems={activeItem.testProblems || []}
                                                onComplete={(passed, score, durationSpent) => {
                                                    if (document.fullscreenElement) {
                                                        document.exitFullscreen().catch(err => console.error(err));
                                                    }
                                                    setIsTestFullScreen(false);
                                                    setLastTestResult({ passed, score });
                                                    if (passed) {
                                                        completeItem(activeItem.id, durationSpent, true);
                                                    }
                                                }}
                                            />
                                        </div>
                                    )
                                ) : activeItem.type === "ASSIGNMENT" ? (
                                    activeItem.assignment?.problems?.[0]?.leetcodeUrl ? (
                                        <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
                                            {/* ... LeetCode UI ... */}
                                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#2a2a2a]">
                                                <Code className="h-10 w-10 text-yellow-500" />
                                            </div>

                                            <div className="space-y-2">
                                                <h2 className="text-2xl font-bold">{activeItem.title}</h2>
                                                <p className="text-gray-400 max-w-md mx-auto">
                                                    Solve this problem on LeetCode and verify your submission here.
                                                </p>
                                            </div>

                                            <div className="flex flex-col gap-4 w-full max-w-sm">
                                                <a
                                                    href={activeItem.assignment.problems[0].leetcodeUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center gap-2 rounded-lg bg-[#2a2a2a] px-6 py-3 font-bold hover:bg-[#333] transition-colors"
                                                >
                                                    Solve on LeetCode <Unlock size={16} />
                                                </a>

                                                <div className="relative">
                                                    <div className="absolute inset-0 flex items-center">
                                                        <span className="w-full border-t border-gray-800" />
                                                    </div>
                                                    <div className="relative flex justify-center text-xs uppercase">
                                                        <span className="bg-[#0e0e0e] px-2 text-gray-500">Then</span>
                                                    </div>
                                                </div>

                                                <LeetCodeVerifier
                                                    problemSlug={activeItem.assignment.problems[0].slug || activeItem.assignment.problems[0].leetcodeUrl.split("/problems/")[1]?.split("/")[0] || ""}
                                                    onVerified={() => completeItem(activeItem.id)}
                                                />
                                            </div>
                                        </div>
                                    ) : (
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
                                    )
                                ) : activeItem.type === "WEB_DEV" ? (
                                    !isWebDevFullScreen ? (
                                        <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                                            <Layout className="h-16 w-16 text-gray-600" />
                                            <h2 className="text-xl font-bold">Web Development Project</h2>
                                            <p className="text-gray-400">
                                                This module contains a web development assignment. Click below to start.
                                            </p>
                                            <button
                                                onClick={() => {
                                                    setIsWebDevFullScreen(true);
                                                    document.documentElement.requestFullscreen().catch(err => {
                                                        console.error("Error entering fullscreen:", err);
                                                    });
                                                }}
                                                className="rounded-full bg-blue-600 px-8 py-3 font-bold hover:bg-blue-700"
                                            >
                                                Start Assignment
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="h-full w-full overflow-hidden bg-[#0e0e0e]">
                                            <WebDevPlayer
                                                instructions={activeItem.webDevInstructions || ""}
                                                initialCode={typeof activeItem.webDevInitialCode === 'string' ? JSON.parse(activeItem.webDevInitialCode) : { html: "", css: "", js: "" }}
                                                savedSubmission={typeof activeItem.webDevSubmission === 'string' ? JSON.parse(activeItem.webDevSubmission) : undefined}
                                                onComplete={(submission: any) => submitWebDev(activeItem.id, submission)}
                                                onBack={() => {
                                                    setIsWebDevFullScreen(false);
                                                    if (document.fullscreenElement) {
                                                        document.exitFullscreen().catch(err => console.error(err));
                                                    }
                                                }}
                                            />
                                        </div>
                                    )
                                ) : activeItem.type === "LEETCODE" ? (
                                    <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
                                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#2a2a2a]">
                                            <Code className="h-10 w-10 text-yellow-500" />
                                        </div>

                                        <div className="space-y-2">
                                            <h2 className="text-2xl font-bold">{activeItem.title}</h2>
                                            <p className="text-gray-400 max-w-md mx-auto">
                                                Solve this problem on LeetCode and verify your submission here.
                                            </p>
                                        </div>

                                        <div className="flex flex-col gap-4 w-full max-w-sm">
                                            <a
                                                href={activeItem.assignment?.problems?.[0]?.leetcodeUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => {
                                                    fetch(`/api/modules/items/${activeItem.id}/start`, { method: "POST" })
                                                        .then(() => fetchCourseData());
                                                }}
                                                className="flex items-center justify-center gap-2 rounded-lg bg-[#2a2a2a] px-6 py-3 font-bold hover:bg-[#333] transition-colors"
                                            >
                                                Solve on LeetCode <Unlock size={16} />
                                            </a>

                                            <div className="relative">
                                                <div className="absolute inset-0 flex items-center">
                                                    <span className="w-full border-t border-gray-800" />
                                                </div>
                                                <div className="relative flex justify-center text-xs uppercase">
                                                    <span className="bg-[#0e0e0e] px-2 text-gray-500">Then</span>
                                                </div>
                                            </div>

                                            <LeetCodeVerifier
                                                problemSlug={activeItem.assignment?.problems?.[0]?.slug || activeItem.assignment?.problems?.[0]?.leetcodeUrl?.split("/problems/")[1]?.split("/")[0] || ""}
                                                onVerified={() => completeItem(activeItem.id)}
                                            />

                                            {activeItem.assignment?.problems?.[0]?.videoSolution && (
                                                <div className="mt-4 border-t border-gray-800 pt-4">
                                                    {!activeItem.startedAt ? (
                                                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                                                            <Lock size={14} />
                                                            <span>Solution video unlocks 20m after starting</span>
                                                        </div>
                                                    ) : (
                                                        (() => {
                                                            const startTime = new Date(activeItem.startedAt!).getTime();
                                                            const unlockTime = startTime + 20 * 60 * 1000;
                                                            const now = new Date().getTime();
                                                            const isUnlocked = now >= unlockTime;

                                                            if (isUnlocked) {
                                                                return (
                                                                    <div className="space-y-2">
                                                                        <h3 className="text-sm font-bold text-gray-300">Solution Video</h3>
                                                                        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                                                                            {activeItem.assignment?.problems?.[0]?.videoSolution?.includes("cloudinary.com") || activeItem.assignment?.problems?.[0]?.videoSolution?.includes("r2.cloudflarestorage.com") || activeItem.assignment?.problems?.[0]?.videoSolution?.endsWith(".mp4") ? (
                                                                                <video
                                                                                    src={signedSolutionUrl || activeItem.assignment?.problems?.[0]?.videoSolution}
                                                                                    controls
                                                                                    className="h-full w-full object-contain"
                                                                                />
                                                                            ) : (
                                                                                <iframe
                                                                                    src={activeItem.assignment?.problems?.[0]?.videoSolution?.replace("watch?v=", "embed/")}
                                                                                    className="h-full w-full"
                                                                                    allowFullScreen
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            } else {
                                                                const diff = unlockTime - now;
                                                                const minutes = Math.floor(diff / (1000 * 60));
                                                                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                                                                return (
                                                                    <div className="flex items-center justify-center gap-2 rounded bg-[#1a1a1a] p-3 text-sm text-yellow-500">
                                                                        <Clock size={16} />
                                                                        <span>Solution unlocks in {minutes}m {seconds}s</span>
                                                                    </div>
                                                                );
                                                            }
                                                        })()
                                                    )}
                                                </div>
                                            )}
                                        </div>
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
                                        style={{ width: `calc(${100 - splitRatio}% - 1rem)` }}
                                    >
                                        <div className="flex-1 overflow-hidden rounded-lg border border-gray-800 bg-[#1e1e1e]">
                                            <div className="flex items-center justify-between border-b border-gray-700 bg-[#111111] px-4 py-2">
                                                <div className="flex items-center gap-2">
                                                    {/* Mode Toggle */}
                                                    <div className="flex rounded bg-[#1e1e1e] p-1">
                                                        <button
                                                            onClick={() => setPracticeType("dsa")}
                                                            className={`rounded px-3 py-1 text-xs font-bold transition-colors ${practiceType === "dsa" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}
                                                        >
                                                            DSA
                                                        </button>
                                                        <button
                                                            onClick={() => setPracticeType("web")}
                                                            className={`rounded px-3 py-1 text-xs font-bold transition-colors ${practiceType === "web" ? "bg-orange-500 text-white" : "text-gray-400 hover:text-white"}`}
                                                        >
                                                            Dev
                                                        </button>
                                                    </div>

                                                    {/* Controls based on mode */}
                                                    {practiceType === "dsa" ? (
                                                        <select
                                                            value={practiceLanguage}
                                                            onChange={(e) => setPracticeLanguage(e.target.value as Language)}
                                                            className="rounded bg-[#1e1e1e] px-2 py-1 text-xs text-white focus:outline-none border border-gray-700"
                                                        >
                                                            <option value="python">Python</option>
                                                            <option value="cpp">C++</option>
                                                            <option value="java">Java</option>
                                                        </select>
                                                    ) : (
                                                        <div className="flex gap-1">
                                                            {webFiles.map(f => (
                                                                <button
                                                                    key={f.name}
                                                                    onClick={() => setActiveWebFile(f.name)}
                                                                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${activeWebFile === f.name ? "bg-[#1e1e1e] text-orange-400 border border-orange-400/30" : "text-gray-400 hover:text-white"}`}
                                                                >
                                                                    {f.name}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {practiceType === "dsa" && (
                                                        <button
                                                            onClick={runPracticeCode}
                                                            disabled={isRunning}
                                                            className="rounded bg-green-600 px-3 py-1 text-xs font-bold hover:bg-green-700 disabled:opacity-50"
                                                        >
                                                            {isRunning ? "Running..." : "Run Code"}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={savePracticeCode} // Reusing save for now, could act differently for web
                                                        className="rounded bg-purple-600 px-3 py-1 text-xs font-bold hover:bg-purple-700"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="h-[calc(100%-44px)]">
                                                {practiceType === "dsa" ? (
                                                    <CodeEditor
                                                        language={practiceLanguage}
                                                        code={practiceCode}
                                                        onChange={(val) => setPracticeCode(val || "")}
                                                    />
                                                ) : (
                                                    <CodeEditor
                                                        key={activeWebFile}
                                                        language={webFiles.find(f => f.name === activeWebFile)?.language as any}
                                                        code={webFiles.find(f => f.name === activeWebFile)?.content || ""}
                                                        onChange={(val) => {
                                                            setWebFiles(files => files.map(f => f.name === activeWebFile ? { ...f, content: val || "" } : f));
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <div className="h-1/3 overflow-hidden rounded-lg border border-gray-800 bg-[#111111]">
                                            {practiceType === "dsa" ? (
                                                <Console
                                                    output={practiceOutput}
                                                    status={runStatus}
                                                    onInput={setCustomInput}
                                                />
                                            ) : (
                                                <div className="h-full w-full flex flex-col">
                                                    <div className="bg-[#161616] px-3 py-1 text-xs font-bold text-gray-400 border-b border-gray-800 flex justify-between items-center">
                                                        <span>Live Preview</span>
                                                        <div className="flex gap-2">
                                                            <div className="h-2 w-2 rounded-full bg-red-500" />
                                                            <div className="h-2 w-2 rounded-full bg-yellow-500" />
                                                            <div className="h-2 w-2 rounded-full bg-green-500" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 bg-white">
                                                        <iframe
                                                            srcDoc={webSrcDoc}
                                                            title="preview"
                                                            className="h-full w-full border-0"
                                                            sandbox="allow-scripts"
                                                        />
                                                    </div>
                                                </div>
                                            )}
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
