"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, Lock, Video, Zap, LogOut, XCircle, ArrowLeft, Clock } from "lucide-react";

import CodeEditor from "@/components/CodeEditor";
import Console from "@/components/Console";
import ComplexityAnalysis from "@/components/ComplexityAnalysis";
import LeetCodeVerifier from "@/components/LeetCodeVerifier";
import { cn } from "@/lib/utils";

import { Language } from "@/types";

interface TestCase {
    id: string;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
}

interface Hint {
    type: "text" | "video";
    content: string;
    locked: boolean;
    unlockTime: string;
}

interface Problem {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    defaultCode: { python: string; cpp: string; java: string };
    testCases: TestCase[];
    hints: Hint[];
    leetcodeUrl?: string;
    slug?: string;
    isPractice?: boolean;
    videoSolution?: string;
}

interface TestCaseResult {
    id: string;
    passed: boolean;
    actualOutput: string;
    expectedOutput: string;
}

export default function PracticePlayerPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const isFocusMode = searchParams.get("mode") === "focus";
    const problemId = params.id as string;

    const [problem, setProblem] = useState<Problem | null>(null);
    const [language, setLanguage] = useState<Language>("java");
    const [code, setCode] = useState("");
    const [output, setOutput] = useState("");
    const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");
    const [customInput, setCustomInput] = useState("");
    const [activeTab, setActiveTab] = useState<"editor" | "console" | "results" | "ask-ai">("editor");
    const [testCaseResults, setTestCaseResults] = useState<TestCaseResult[]>([]);
    const [expandedHints, setExpandedHints] = useState<number[]>([]);
    const [errorLine, setErrorLine] = useState<number | null>(null);

    // Resizable panel state
    const [leftWidth, setLeftWidth] = useState(50);
    const [isDragging, setIsDragging] = useState(false);

    // Ask AI state
    const [aiMessage, setAiMessage] = useState<string | null>(null);
    const [isAskingAi, setIsAskingAi] = useState(false);
    const [canAskAi, setCanAskAi] = useState(false);
    const [timeToAi, setTimeToAi] = useState<string>("");
    const [leetcodeUsername, setLeetcodeUsername] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);

    const [showGiveAnswer, setShowGiveAnswer] = useState(false);

    // Full Screen State
    const [hasStarted, setHasStarted] = useState(false);
    const [showFocusOverlay, setShowFocusOverlay] = useState(isFocusMode);

    // Stopwatch State
    const [startTime, setStartTime] = useState<number>(Date.now());
    const [elapsedTime, setElapsedTime] = useState<string>("00:00");

    useEffect(() => {
        // Reset timer on problem load/change
        setStartTime(Date.now());
    }, [problemId]);

    // Timer Tick
    useEffect(() => {
        if (!hasStarted) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = Math.floor((now - startTime) / 1000);
            const mins = Math.floor(diff / 60);
            const secs = diff % 60;
            setElapsedTime(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [hasStarted, startTime]);

    // Auto-enter fullscreen when starting
    useEffect(() => {
        if (isFocusMode && !hasStarted) {
            setShowFocusOverlay(true);
        }
    }, [isFocusMode, hasStarted]);

    const enterFullScreen = async () => {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            try {
                await elem.requestFullscreen();
                setHasStarted(true);
                setStartTime(Date.now()); // Start/Reset timer when entering fullscreen
                if (isFocusMode) setShowFocusOverlay(false);
            } catch (err) {
                console.error("Error entering fullscreen:", err);
                alert("Failed to enter full screen. Please try again.");
            }
        } else {
            setHasStarted(true);
            setStartTime(Date.now());
            if (isFocusMode) setShowFocusOverlay(false);
        }
    };

    const startResizing = () => setIsDragging(true);
    const stopResizing = () => setIsDragging(false);

    const resize = (e: MouseEvent) => {
        if (isDragging) {
            const newWidth = (e.clientX / window.innerWidth) * 100;
            if (newWidth > 20 && newWidth < 80) {
                setLeftWidth(newWidth);
            }
        }
    };

    useEffect(() => {
        if (isDragging) {
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
    }, [isDragging]);

    // AI analysis state
    const [analysis, setAnalysis] = useState<{
        timeComplexity: string;
        spaceComplexity: string;
        reason: string;
        suggestion: string;
    } | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Fetch problem data
    useEffect(() => {
        const fetchProblem = async () => {
            try {
                const res = await fetch(`/api/practice/${problemId}`);
                if (!res.ok) throw new Error("Failed to fetch problem");

                // Inspect response status
                if (res.status === 401) {
                    router.push("/login");
                    return;
                }

                const data = await res.json();
                const problemData: Problem = data;

                // Parse defaultCode if string
                if (typeof problemData.defaultCode === 'string') {
                    try {
                        problemData.defaultCode = JSON.parse(problemData.defaultCode);
                    } catch (e) {
                        problemData.defaultCode = { python: "", cpp: "", java: "" };
                    }
                }

                // Parse hints if string or null
                let rawHints: any[] = [];
                if (Array.isArray(problemData.hints)) {
                    rawHints = problemData.hints;
                } else if (typeof problemData.hints === 'string') {
                    try {
                        const parsed = JSON.parse(problemData.hints);
                        rawHints = Array.isArray(parsed) ? parsed : [];
                    } catch (e) {
                        rawHints = [];
                    }
                }

                // Normalize hints to Hint objects
                const hints: Hint[] = rawHints.map((h: any) => {
                    if (typeof h === 'string') {
                        return {
                            type: 'text',
                            content: h,
                            locked: false, // Default unlocked for simple hints in practice? Actually let's start locked for progressive
                            unlockTime: new Date().toISOString()
                        };
                    }
                    // Ensure object has required fields
                    return {
                        type: h.type || 'text',
                        content: h.content || '',
                        locked: h.locked !== undefined ? h.locked : true, // Default locked
                        unlockTime: h.unlockTime || new Date().toISOString()
                    };
                });

                // Append video solution if exists and not already in hints
                if (problemData.videoSolution) {
                    const hasVideo = hints.some(h => h.type === 'video');
                    if (!hasVideo) {
                        // In practice mode, we can set unlock time relative to NOW (load time)
                        // unlocking 5 mins after the last hint
                        const unlockTime = Date.now() + (hints.length + 1) * 300000;
                        hints.push({
                            type: 'video',
                            content: problemData.videoSolution,
                            locked: true,
                            unlockTime: new Date(unlockTime).toISOString()
                        });
                    }
                }

                problemData.hints = hints;

                setProblem(problemData);
                setCode(problemData.defaultCode[language as keyof typeof problemData.defaultCode]);
            } catch (e) {
                console.error("Error fetching problem:", e);
                // router.push("/practice");
            }
        };
        fetchProblem();
    }, [problemId, language, router]);

    // Update code when language changes
    const prevLanguageRef = useRef<Language>(language);
    useEffect(() => {
        if (problem && prevLanguageRef.current !== language) {
            setCode(problem.defaultCode[language as keyof typeof problem.defaultCode]);
            prevLanguageRef.current = language;
        }
    }, [language, problem]);

    // Hint unlocking timer & Ask AI timer
    useEffect(() => {
        if (!problem) return;
        const interval = setInterval(() => {
            const now = Date.now();

            // Hints - Progressive Unlocking (Every 5 minutes)
            setProblem(prev => {
                if (!prev) return prev;
                let changed = false;
                const updatedHints = prev.hints.map((h, index) => {
                    // Unlock Hint i at: startTime + (index + 1) * 5 minutes
                    const unlockTimestamp = startTime + (index + 1) * 5 * 60 * 1000;
                    const isLocked = now < unlockTimestamp;

                    if (isLocked !== h.locked) changed = true;

                    // Calculate formatting for display if needed, but we just use locked status
                    return { ...h, locked: isLocked, unlockTime: new Date(unlockTimestamp).toISOString() };
                });

                if (!changed) return prev;
                return { ...prev, hints: updatedHints };
            });

            // Ask AI Timer (7 minutes)
            const unlockTime = startTime + 7 * 60 * 1000;
            const remaining = unlockTime - now;

            if (remaining <= 0) {
                setCanAskAi(true);
                setTimeToAi("");
            } else {
                setCanAskAi(false);
                const minutes = Math.floor(remaining / 60000);
                const seconds = Math.floor((remaining % 60000) / 1000);
                setTimeToAi(`${minutes}:${seconds.toString().padStart(2, "0")}`);
            }

        }, 1000);
        return () => clearInterval(interval);
    }, [problem?.id, startTime]); // Depend on startTime which is set on load/fullscreen

    const parseErrorLine = (errorMessage: string, lang: Language): number | null => {
        if (lang === "python") {
            const matches = [...errorMessage.matchAll(/line (\d+)/gi)];
            if (matches.length > 0) {
                return parseInt(matches[matches.length - 1][1], 10);
            }
            return null;
        } else if (lang === "cpp") {
            const match = errorMessage.match(/:(\d+):\d+: error:/i) || errorMessage.match(/:(\d+):.*error:/i);
            return match ? parseInt(match[1], 10) : null;
        }
        return null;
    };

    const handleExitFocus = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => console.error(err));
        }
        router.push("/practice");
    };

    // Run user code
    const handleRun = async () => {
        setStatus("running");
        setOutput("");
        setErrorLine(null);
        setActiveTab("console");
        try {
            const res = await fetch("/api/compile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ language, code, input: customInput }),
            });
            const data = await res.json();
            if (data.error) {
                setStatus("error");
                setOutput(data.error);
                const line = data.line || parseErrorLine(data.error, language);
                if (line) setErrorLine(line);
            } else {
                setStatus("success");
                setOutput(data.output || "No output");
                setErrorLine(null);
            }
        } catch (e) {
            setStatus("error");
            setOutput("Failed to run code");
        }
    };

    const normalizeOutput = (str: string) => {
        return str
            .replace(/,/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    };

    // Run test cases
    const handleRunTestCases = async () => {
        if (!problem) return;
        setStatus("running");
        setTestCaseResults([]);
        setErrorLine(null);
        setActiveTab("results");
        const results: TestCaseResult[] = [];
        for (const tc of problem.testCases) {
            try {
                const res = await fetch("/api/compile", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ language, code, input: tc.input }),
                });
                const data = await res.json();
                if (data.error) {
                    results.push({ id: tc.id, passed: false, actualOutput: data.error, expectedOutput: tc.expectedOutput });
                } else {
                    const actual = normalizeOutput(data.output || "");
                    const expected = normalizeOutput(tc.expectedOutput);
                    const passed = actual === expected;
                    results.push({ id: tc.id, passed, actualOutput: data.output || "", expectedOutput: tc.expectedOutput });
                }
            } catch (e) {
                results.push({ id: tc.id, passed: false, actualOutput: "Error running test case", expectedOutput: tc.expectedOutput });
            }
        }
        setTestCaseResults(results);
        setStatus(results.every(r => r.passed) ? "success" : "error");

    };

    // Submit solution
    const handleSubmit = async () => {
        if (!problem) return;

        const timeSpent = Math.floor((Date.now() - startTime) / 1000);

        try {
            // Updated to use practice submit endpoint
            const res = await fetch("/api/practice/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    problemId: problem.id,
                    passed: true,
                    duration: timeSpent,
                    language
                }),
            });

            const data = await res.json();

            if (res.ok) {
                if (data.rewarded) {
                    alert(`🎉 CONGRATULATIONS! 🎉\n\nYou passed and earned ₹5!\nWallet Balance: ₹${data.walletBalance}`);
                } else {
                    alert(`Great job! You passed!\n\n(No reward: Already solved this month)\nWallet Balance: ₹${data.walletBalance}`);
                }

                if (document.fullscreenElement) {
                    document.exitFullscreen().catch(err => console.error(err));
                }
                router.push("/practice");
            } else {
                alert(data.error || "Failed to submit");
            }

        } catch (e) {
            console.error("Submission failed:", e);
            alert("Failed to submit");
        }
    };

    const toggleHint = (index: number) => {
        setExpandedHints(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const formatTimeRemaining = (unlockTime: string) => {
        const remaining = Math.max(0, Math.floor((new Date(unlockTime).getTime() - Date.now()) / 1000));
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    const handleAskAi = async (mode: "guide" | "solution") => {
        if (!problem) return;
        setIsAskingAi(true);
        try {
            const res = await fetch("/api/ask-ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    problemDescription: problem.description,
                    studentCode: code,
                    mode
                }),
            });
            const data = await res.json();
            setAiMessage(data.message);
            if (mode === "guide") {
                setShowGiveAnswer(true);
            }
        } catch (e) {
            setAiMessage("Failed to get help from AI.");
        } finally {
            setIsAskingAi(false);
        }
    };

    // AI analysis runs every 3 seconds
    useEffect(() => {
        const interval = setInterval(async () => {
            if (!code) return;
            setIsAnalyzing(true);
            try {
                const res = await fetch("/api/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code, language }),
                });
                const data = await res.json();
                setAnalysis(data);
            } catch (e) {
                console.error("Analysis failed", e);
            } finally {
                setIsAnalyzing(false);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [code, language]);

    if (!problem) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0e0e0e] text-white">
                <div className="text-lg">Loading problem...</div>
            </div>
        );
    }

    if (showFocusOverlay) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0e0e0e] text-white">
                <div className="max-w-md text-center">
                    <div className="mb-6 flex justify-center">
                        <div className="rounded-full bg-blue-900/20 p-6">
                            <Zap className="h-12 w-12 text-blue-400" />
                        </div>
                    </div>
                    <h1 className="mb-4 text-3xl font-bold">Focus Mode</h1>
                    <p className="mb-8 text-gray-400">
                        Enter full-screen mode to minimize distractions and focus on your code.
                    </p>
                    <button
                        onClick={enterFullScreen}
                        className="rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                        Start Practice Session
                    </button>
                    <button
                        onClick={() => router.push("/practice")}
                        className="mt-4 block w-full text-sm text-gray-500 hover:text-gray-300"
                    >
                        Exit
                    </button>
                </div>
            </div>
        );
    }

    if (!hasStarted) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-[#0e0e0e] text-white">
                <div className="max-w-md text-center">
                    <h1 className="mb-6 text-3xl font-bold">{problem.title}</h1>
                    <p className="mb-8 text-gray-400">
                        Ready to solve this problem?
                    </p>
                    <button
                        onClick={enterFullScreen}
                        className="rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                        Start Practice
                    </button>
                    <button
                        onClick={() => router.push("/practice")}
                        className="mt-4 block w-full text-sm text-gray-500 hover:text-gray-300"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen flex-col bg-[#0e0e0e] text-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-800 bg-[#161616] px-6 py-4">
                <div className="flex items-center gap-4">
                    <button onClick={handleExitFocus} className="text-gray-400 hover:text-white">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold">{problem.title}</h1>
                        <span className="text-sm text-gray-400">{problem.difficulty}</span>
                    </div>
                </div>

                {/* Timer Display */}
                <div className="flex items-center gap-2 rounded bg-gray-900 px-4 py-2 border border-blue-900/30">
                    <Clock size={16} className="text-blue-400" />
                    <span className="font-mono text-xl font-bold text-blue-100">{elapsedTime}</span>
                </div>

                <div className="flex items-center gap-4">
                    {!problem.leetcodeUrl && (
                        <>
                            <select
                                value={language}
                                onChange={e => setLanguage(e.target.value as Language)}
                                className="rounded border border-gray-700 bg-[#1e1e1e] px-4 py-2 text-sm"
                            >
                                <option value="java">Java</option>
                                <option value="python">Python</option>
                                <option value="cpp">C++</option>
                            </select>
                            <button onClick={handleRun} disabled={status === "running"} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">Run</button>
                            <button onClick={handleRunTestCases} disabled={status === "running"} className="rounded bg-green-600 px-4 py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50">Test</button>
                            {testCaseResults.length > 0 && testCaseResults.every(r => r.passed) && (
                                <button onClick={handleSubmit} disabled={status === "running"} className="rounded bg-purple-600 px-4 py-2 text-sm font-medium hover:bg-purple-700 disabled:opacity-50">Submit</button>
                            )}
                        </>
                    )}
                    <button
                        onClick={handleExitFocus}
                        className="flex items-center gap-2 rounded bg-red-900/20 border border-red-900 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900/40"
                    >
                        <LogOut className="h-4 w-4" />
                        Exit
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left panel: Description & Hints */}
                <div
                    className="overflow-y-auto border-r border-gray-800 bg-[#0e0e0e] p-6"
                    style={{ width: `${leftWidth}%` }}
                >
                    <div className="space-y-8">
                        {/* Description */}
                        <div>
                            <h2 className="mb-4 text-lg font-semibold">Problem Description</h2>
                            <div className="prose prose-invert text-sm leading-relaxed text-gray-300">{problem.description}</div>
                        </div>

                        {/* Test Cases */}
                        <div>
                            <h3 className="mb-4 text-lg font-semibold">Test Cases</h3>
                            <div className="space-y-3">
                                {problem.testCases.map((tc, idx) => {
                                    const result = testCaseResults.find(r => r.id === tc.id);
                                    return (
                                        <div
                                            key={tc.id}
                                            className={cn(
                                                "rounded border p-4",
                                                result
                                                    ? result.passed
                                                        ? "border-green-800 bg-green-900/20"
                                                        : "border-red-800 bg-red-900/20"
                                                    : "border-gray-700 bg-[#1e1e1e]"
                                            )}
                                        >
                                            <div className="mb-3 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-medium text-gray-400">Case {idx + 1}</span>
                                                    {tc.isHidden && (
                                                        <span className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300">Hidden</span>
                                                    )}
                                                </div>
                                                {result && (
                                                    <span className={cn("text-sm font-bold", result.passed ? "text-green-400" : "text-red-400")}>
                                                        {result.passed ? "Passed" : "Failed"}
                                                    </span>
                                                )}
                                            </div>
                                            {!tc.isHidden && (
                                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-medium text-gray-500">Input:</span>
                                                        <pre className="overflow-x-auto rounded bg-[#111111] p-2 text-xs text-gray-300">{tc.input || "(empty)"}</pre>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-medium text-gray-500">Expected Output:</span>
                                                        <pre className="overflow-x-auto rounded bg-[#111111] p-2 text-xs text-gray-300">{tc.expectedOutput}</pre>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* AI Complexity Analysis */}
                        <div>
                            <ComplexityAnalysis analysis={analysis} loading={isAnalyzing} />
                        </div>

                        {/* Hints Section */}
                        {problem.hints.length > 0 && (
                            <div>
                                <div className="mb-4 flex items-center gap-3">
                                    <h3 className="text-lg font-semibold">Hints</h3>
                                    <span className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-400">
                                        {problem.hints.filter(h => !h.locked).length}/{problem.hints.length} unlocked
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    {problem.hints.map((hint, idx) => (
                                        <div key={idx} className="overflow-hidden rounded-lg border border-gray-800 bg-[#161616]">
                                            <button
                                                onClick={() => toggleHint(idx)}
                                                className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-[#1e1e1e]"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="font-medium text-gray-300">Hint {idx + 1}</span>
                                                    {hint.type === "video" && (
                                                        <span className="flex items-center gap-1 rounded bg-blue-900/30 px-2 py-0.5 text-xs text-blue-400">
                                                            <Video size={12} /> Solution
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {hint.locked ? (
                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                            <Lock size={14} />
                                                            <span>Unlocks in {formatTimeRemaining(hint.unlockTime)}</span>
                                                        </div>
                                                    ) : (
                                                        <ChevronDown size={16} className={cn("transition-transform text-gray-400", expandedHints.includes(idx) && "rotate-180")} />
                                                    )}
                                                </div>
                                            </button>
                                            {expandedHints.includes(idx) && !hint.locked && (
                                                <div className="border-t border-gray-800 bg-[#111111] p-4 text-sm text-gray-300">
                                                    {hint.type === "text" ? (
                                                        hint.content
                                                    ) : (
                                                        <video src={hint.content} controls className="w-full rounded" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Drag Handle */}
                <div
                    className="w-1 cursor-col-resize bg-gray-800 hover:bg-blue-500 transition-colors"
                    onMouseDown={startResizing}
                />

                {/* Right panel: Tabbed Interface */}
                <div
                    className="flex flex-col bg-[#111111]"
                    style={{ width: `${100 - leftWidth}%` }}
                >
                    {/* Tabs */}
                    {!problem.leetcodeUrl && (
                        <div className="flex border-b border-gray-800 bg-[#161616]">
                            <button
                                onClick={() => setActiveTab("editor")}
                                className={cn(
                                    "px-6 py-3 text-sm font-medium transition-colors",
                                    activeTab === "editor" ? "border-b-2 border-blue-500 text-white bg-[#1e1e1e]" : "text-gray-400 hover:text-gray-200 hover:bg-[#1e1e1e]"
                                )}
                            >
                                Editor
                            </button>
                            <button
                                onClick={() => setActiveTab("console")}
                                className={cn(
                                    "px-6 py-3 text-sm font-medium transition-colors",
                                    activeTab === "console" ? "border-b-2 border-blue-500 text-white bg-[#1e1e1e]" : "text-gray-400 hover:text-gray-200 hover:bg-[#1e1e1e]"
                                )}
                            >
                                Console
                            </button>
                            <button
                                onClick={() => setActiveTab("results")}
                                className={cn(
                                    "px-6 py-3 text-sm font-medium transition-colors",
                                    activeTab === "results" ? "border-b-2 border-blue-500 text-white bg-[#1e1e1e]" : "text-gray-400 hover:text-gray-200 hover:bg-[#1e1e1e]"
                                )}
                            >
                                Test Results
                            </button>
                            <button
                                onClick={() => canAskAi && setActiveTab("ask-ai")}
                                className={cn(
                                    "px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2",
                                    activeTab === "ask-ai" ? "border-b-2 border-blue-500 text-white bg-[#1e1e1e]" : "text-gray-400 hover:text-gray-200 hover:bg-[#1e1e1e]",
                                    !canAskAi && "opacity-50 cursor-not-allowed hover:text-gray-400 hover:bg-transparent"
                                )}
                            >
                                Ask AI
                                {!canAskAi && <span className="text-xs">({timeToAi})</span>}
                                {!canAskAi && <Lock size={12} />}
                            </button>
                        </div>
                    )}

                    {/* Tab Content */}
                    <div className="flex-1 overflow-hidden relative">
                        {problem.leetcodeUrl ? (
                            <div className="flex h-full flex-col items-center justify-center space-y-8 p-8 text-center">
                                {/* LeetCode UI Placeholder - Practice problems usually aren't leetcode links but can be */}
                                <div className="max-w-md space-y-6">
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-bold">Solve on LeetCode</h2>
                                        <p className="text-gray-400">
                                            This problem must be solved on LeetCode.
                                        </p>
                                    </div>
                                    <a
                                        href={problem.leetcodeUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2a2a2a] px-6 py-4 text-lg font-bold hover:bg-[#333] transition-colors"
                                    >
                                        Open Problem on LeetCode <LogOut size={20} />
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className={cn("absolute inset-0 flex flex-col", activeTab === "editor" ? "z-10 visible" : "z-0 invisible")}>
                                <CodeEditor
                                    language={language}
                                    code={code}
                                    onChange={(value) => {
                                        setCode(value || "");
                                        setTestCaseResults([]);
                                    }}
                                    errorLine={errorLine}
                                    errorMessage={status === "error" ? output : null}
                                />
                            </div>
                        )}

                        {activeTab === "console" && (
                            <div className="h-full p-4">
                                <Console output={output} status={status} onInput={setCustomInput} />
                            </div>
                        )}

                        {activeTab === "results" && (
                            <div className="h-full overflow-y-auto p-4">
                                <div className="space-y-3">
                                    {problem.testCases.map((tc, idx) => {
                                        const result = testCaseResults.find(r => r.id === tc.id);
                                        return (
                                            <div
                                                key={tc.id}
                                                className={cn(
                                                    "rounded border p-4",
                                                    result
                                                        ? result.passed
                                                            ? "border-green-800 bg-green-900/20"
                                                            : "border-red-800 bg-red-900/20"
                                                        : "border-gray-700 bg-[#1e1e1e]"
                                                )}
                                            >
                                                <div className="mb-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-medium text-gray-400">Case {idx + 1}</span>
                                                        {tc.isHidden && (
                                                            <span className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300">Hidden</span>
                                                        )}
                                                    </div>
                                                    {result && (
                                                        <span className={cn("text-sm font-bold", result.passed ? "text-green-400" : "text-red-400")}>
                                                            {result.passed ? "Passed" : "Failed"}
                                                        </span>
                                                    )}
                                                </div>
                                                {!tc.isHidden && (
                                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                        <div className="space-y-1">
                                                            <span className="text-xs font-medium text-gray-500">Input:</span>
                                                            <pre className="overflow-x-auto rounded bg-[#111111] p-2 text-xs text-gray-300">{tc.input || "(empty)"}</pre>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <span className="text-xs font-medium text-gray-500">Expected Output:</span>
                                                            <pre className="overflow-x-auto rounded bg-[#111111] p-2 text-xs text-gray-300">{tc.expectedOutput}</pre>
                                                        </div>
                                                        {result && !result.passed && (
                                                            <div className="col-span-2 mt-2 border-t border-red-800/30 pt-2">
                                                                <span className="text-xs font-medium text-red-400">Actual Output:</span>
                                                                <pre className="mt-1 overflow-x-auto rounded bg-[#111111] p-2 text-xs text-red-300">{result.actualOutput}</pre>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {testCaseResults.length === 0 && (
                                        <div className="flex h-full items-center justify-center text-gray-500">
                                            Run tests to see results
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "ask-ai" && (
                            <div className="h-full overflow-y-auto p-6">
                                {!canAskAi ? (
                                    <div className="flex h-full flex-col items-center justify-center text-center">
                                        <Lock className="mb-4 h-12 w-12 text-gray-600" />
                                        <h3 className="mb-2 text-xl font-semibold">Ask AI is Locked</h3>
                                        <p className="text-gray-400">
                                            You can ask AI for help after 7 minutes.
                                        </p>
                                        <p className="mt-4 text-2xl font-mono font-bold text-blue-400">
                                            {timeToAi}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="rounded-lg border border-gray-800 bg-[#161616] p-6">
                                            <h3 className="mb-4 text-lg font-semibold">Ask AI for Help</h3>
                                            <p className="mb-6 text-sm text-gray-400">
                                                Stuck? The AI can analyze your code and provide guidance without giving away the answer immediately.
                                            </p>

                                            {!aiMessage && (
                                                <button
                                                    onClick={() => handleAskAi("guide")}
                                                    disabled={isAskingAi}
                                                    className="rounded bg-blue-600 px-6 py-3 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                                                >
                                                    {isAskingAi ? "Analyzing..." : "Ask AI for Guidance"}
                                                </button>
                                            )}

                                            {aiMessage && (
                                                <div className="mt-6 space-y-4">
                                                    <div className="rounded bg-[#1e1e1e] p-4">
                                                        <h4 className="mb-2 font-medium text-blue-400">AI Response:</h4>
                                                        <div className="prose prose-invert text-sm">
                                                            <pre className="whitespace-pre-wrap font-sans">{aiMessage}</pre>
                                                        </div>
                                                    </div>

                                                    {showGiveAnswer && (
                                                        <div className="border-t border-gray-800 pt-4">
                                                            <p className="mb-4 text-sm text-gray-400">
                                                                Still stuck? You can reveal the full solution.
                                                            </p>
                                                            <button
                                                                onClick={() => handleAskAi("solution")}
                                                                disabled={isAskingAi}
                                                                className="rounded border border-red-900/50 bg-red-900/10 px-6 py-3 text-sm font-medium text-red-400 hover:bg-red-900/30 disabled:opacity-50"
                                                            >
                                                                {isAskingAi ? "Getting Solution..." : "Give Answer"}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
