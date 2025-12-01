
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, Lock, Video, Zap, LogOut } from "lucide-react";

import CodeEditor from "@/components/CodeEditor";
import Console from "@/components/Console";
import ComplexityAnalysis from "@/components/ComplexityAnalysis";
import ProblemLayout from "@/components/ProblemLayout";
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
    startedAt: string;
    testCases: TestCase[];
    hints: Hint[];
    leetcodeUrl?: string;
    slug?: string;
}

interface TestCaseResult {
    id: string;
    passed: boolean;
    actualOutput: string;
    expectedOutput: string;
}

export default function AssignmentPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const isFocusMode = searchParams.get("mode") === "focus";
    const assignmentId = params.id as string;

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
    // Initialize based on URL to avoid flash
    const [showFocusOverlay, setShowFocusOverlay] = useState(isFocusMode);

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
                if (isFocusMode) setShowFocusOverlay(false);
            } catch (err) {
                console.error("Error entering fullscreen:", err);
                alert("Failed to enter full screen. Please try again.");
            }
        } else {
            setHasStarted(true);
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

    // Fetch assignment data
    useEffect(() => {
        const fetchAssignment = async () => {
            try {
                const res = await fetch(`/api/assignments/${assignmentId}`);
                if (!res.ok) throw new Error("Failed to fetch assignment");
                const data = await res.json();
                const problemData: Problem = data.problems[0];
                // Ensure startedAt is present (it comes from the API now)
                const fullProblemData = { ...problemData, startedAt: data.startedAt };
                setProblem(fullProblemData);
                setCode(problemData.defaultCode[language]);
            } catch (e) {
                console.error("Error fetching assignment:", e);
            }
        };
        fetchAssignment();
    }, [assignmentId, language]);

    // Update code when language changes
    const prevLanguageRef = useRef<Language>(language);
    useEffect(() => {
        if (problem && prevLanguageRef.current !== language) {
            setCode(problem.defaultCode[language]);
            prevLanguageRef.current = language;
        }
    }, [language, problem]);

    // Hint unlocking timer & Ask AI timer
    useEffect(() => {
        if (!problem) return;
        const interval = setInterval(() => {
            const now = Date.now();

            // Hints
            setProblem(prev => {
                if (!prev) return prev;
                let changed = false;
                const updatedHints = prev.hints.map(h => {
                    const isLocked = new Date(h.unlockTime).getTime() > now;
                    if (isLocked !== h.locked) changed = true;
                    return { ...h, locked: isLocked };
                });

                if (!changed) return prev;
                return { ...prev, hints: updatedHints };
            });

            // Ask AI Timer (7 minutes = 7 * 60 * 1000 ms)
            if (problem.startedAt) {
                const startTime = new Date(problem.startedAt).getTime();
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
            }

        }, 1000);
        return () => clearInterval(interval);
    }, [problem?.id, problem?.startedAt]);

    const parseErrorLine = (errorMessage: string, lang: Language): number | null => {
        if (lang === "python") {
            // Find all matches for "line <number>"
            const matches = [...errorMessage.matchAll(/line (\d+)/gi)];
            if (matches.length > 0) {
                // Return the last match as it's usually the most relevant in a traceback
                return parseInt(matches[matches.length - 1][1], 10);
            }
            return null;
        } else if (lang === "cpp") {
            // Matches :line:col: error:
            const match = errorMessage.match(/:(\d+):\d+: error:/i) || errorMessage.match(/:(\d+):.*error:/i);
            return match ? parseInt(match[1], 10) : null;
        }
        return null;
    };

    const handleStartFocus = () => {
        enterFullScreen();
    };

    const handleExitFocus = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => console.error(err));
        }
        router.push("/");
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

    // Normalize output for comparison (ignore trailing whitespace, normalize newlines, ignore commas)
    const normalizeOutput = (str: string) => {
        return str
            .replace(/,/g, " ")       // Replace commas with spaces
            .replace(/\s+/g, " ")     // Collapse multiple whitespace to single space
            .trim();                  // Trim leading/trailing whitespace
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
                    // setErrorLine(parseErrorLine(data.error, language)); // Error line is for editor, not test results
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

        try {
            await fetch(`/api/assignments/${assignmentId}/submissions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, language, passed: true }),
            });

            alert("Assignment Completed! Redirecting...");
            router.push("/");
        } catch (e) {
            console.error("Submission failed:", e);
            alert("Failed to submit");
        }
    };

    const handleVerify = async () => {
        if (!problem?.slug) return;
        if (!leetcodeUsername) {
            alert("Please enter your LeetCode username");
            return;
        }

        setIsVerifying(true);
        try {
            const res = await fetch("/api/leetcode/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: leetcodeUsername, slug: problem.slug }),
            });
            const data = await res.json();

            if (data.success) {
                alert("Verification Successful! Assignment Completed. ✅");
                // Mark as completed in DB (reusing submission logic but with a flag)
                await fetch(`/api/assignments/${assignmentId}/submissions`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code: "LEETCODE_VERIFIED", language: "leetcode", passed: true }),
                });
                router.push("/");
            } else {
                alert(`Verification Failed: ${data.message}`);
            }
        } catch (e) {
            console.error(e);
            alert("Verification failed due to an error.");
        } finally {
            setIsVerifying(false);
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

    // AI analysis runs every 3 seconds regardless of typing
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
                <div className="text-lg">Loading...</div>
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
                        onClick={handleStartFocus}
                        className="rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                        Start Focus Session
                    </button>
                    <button
                        onClick={() => router.push("/")}
                        className="mt-4 block w-full text-sm text-gray-500 hover:text-gray-300"
                    >
                        Exit
                    </button>
                </div>
            </div>
        );
    }

    if (!hasStarted && !isFocusMode) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-[#0e0e0e] text-white">
                <div className="max-w-md text-center">
                    <h1 className="mb-6 text-3xl font-bold">{problem.title}</h1>
                    <p className="mb-8 text-gray-400">
                        You are about to start the assignment.
                    </p>
                    <button
                        onClick={enterFullScreen}
                        className="rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                        Start Assignment
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen flex-col bg-[#0e0e0e] text-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-800 bg-[#161616] px-6 py-4">
                <div>
                    <h1 className="text-xl font-bold">{problem.title}</h1>
                    <span className="text-sm text-gray-400">{problem.difficulty}</span>
                </div>
                <div className="flex items-center gap-4">
                    {problem.leetcodeUrl ? (
                        <>
                            <input
                                type="text"
                                placeholder="LeetCode Username"
                                value={leetcodeUsername}
                                onChange={(e) => setLeetcodeUsername(e.target.value)}
                                className="rounded border border-gray-700 bg-[#1e1e1e] px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            />
                            <a
                                href={problem.leetcodeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded bg-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-600"
                            >
                                Solve on LeetCode
                            </a>
                            <button
                                onClick={handleVerify}
                                disabled={isVerifying}
                                className="rounded bg-green-600 px-4 py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                            >
                                {isVerifying ? "Verifying..." : "Verify Submission"}
                            </button>
                        </>
                    ) : (
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
                    {isFocusMode && (
                        <button
                            onClick={handleExitFocus}
                            className="flex items-center gap-2 rounded bg-red-900/20 border border-red-900 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900/40"
                        >
                            <LogOut className="h-4 w-4" />
                            Exit Focus
                        </button>
                    )}
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
                            onClick={() => setActiveTab("ask-ai")}
                            className={cn(
                                "px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2",
                                activeTab === "ask-ai" ? "border-b-2 border-blue-500 text-white bg-[#1e1e1e]" : "text-gray-400 hover:text-gray-200 hover:bg-[#1e1e1e]"
                            )}
                        >
                            Ask AI
                            {!canAskAi && <Lock size={12} />}
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-hidden relative">
                        <div className={cn("absolute inset-0 flex flex-col", activeTab === "editor" ? "z-10 visible" : "z-0 invisible")}>
                            <CodeEditor
                                language={language}
                                code={code}
                                onChange={(value) => {
                                    setCode(value || "");
                                    setTestCaseResults([]); // Reset results on code change
                                }}
                                errorLine={errorLine}
                                errorMessage={status === "error" ? output : null}
                            />
                        </div>

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
