"use client";

import React, { useState, useEffect } from "react";
import { Clock, CheckCircle, ChevronDown, FileText, Code, Play, Terminal, XCircle, Lock, Video, RefreshCw } from "lucide-react";
import CodeEditor from "@/components/CodeEditor";
import { cn } from "@/lib/utils";
import { Language } from "@/types";
import WebDevEditor from "./WebDevEditor";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

interface File {
    name: string;
    language: string;
    content: string;
}

interface TestCase {
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
    defaultCode: any; // { python: string, cpp: string }
    testCases: TestCase[];
    hints: Hint[];
    type?: "CODING" | "WEB_DEV";
    webDevInstructions?: string;
    webDevInitialCode?: {
        html: string;
        css: string;
        js: string;
    };
    videoSolution?: string;
}

interface TestPlayerProps {
    duration: number; // minutes
    passingScore: number; // percentage
    problems: Problem[];
    onComplete: (passed: boolean, score: number, durationSpent: number) => void;
}

export default function TestPlayer({ duration, passingScore, problems, onComplete }: TestPlayerProps) {
    const [elapsedTime, setElapsedTime] = useState(0);

    const [activeProblemIndex, setActiveProblemIndex] = useState(0);
    const [language, setLanguage] = useState<"python" | "cpp" | "java">("java");

    // Store code for each problem
    const [userCodes, setUserCodes] = useState<{ [key: string]: string | File[] }>({});
    const [activeFileName, setActiveFileName] = useState("index.html");

    // Store results for each problem
    const [results, setResults] = useState<{ [key: string]: boolean }>({});

    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState("");
    const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");

    // Tabs State
    const [activeTab, setActiveTab] = useState<"console" | "results" | "ask-ai">("console");
    const [testResults, setTestResults] = useState<any>(null);

    // Ask AI state
    const [aiMessage, setAiMessage] = useState<string | null>(null);
    const [isAskingAi, setIsAskingAi] = useState(false);
    const [canAskAi, setCanAskAi] = useState(false);
    const [timeToAi, setTimeToAi] = useState<string>("");
    const [showGiveAnswer, setShowGiveAnswer] = useState(false);
    const [expandedHints, setExpandedHints] = useState<number[]>([]);

    // State for local modified problems (tracking locked hints)
    const [localProblems, setLocalProblems] = useState<Problem[]>([]);

    // Initialize localProblems with hints processing
    useEffect(() => {
        const processed = problems.map(p => {
            let defaultCode: any = p.defaultCode;
            let type: "CODING" | "WEB_DEV" = "CODING";
            let webDevInitialCode = undefined;

            if (typeof defaultCode === 'string') {
                try {
                    defaultCode = JSON.parse(defaultCode);
                } catch (e) {
                    defaultCode = { python: "", cpp: "", java: "" };
                }
            }

            if (defaultCode?.isWebDev) {
                type = "WEB_DEV";
                webDevInitialCode = {
                    html: defaultCode.html,
                    css: defaultCode.css,
                    js: defaultCode.js
                };
            }

            let rawHints: any[] = [];
            if (Array.isArray(p.hints)) {
                rawHints = p.hints;
            } else if (typeof p.hints === 'string') {
                try {
                    const parsed = JSON.parse(p.hints);
                    rawHints = Array.isArray(parsed) ? parsed : [];
                } catch (e) {
                    rawHints = [];
                }
            }

            // Normalize hints
            const hints: Hint[] = rawHints.map((h: any) => {
                if (typeof h === 'string') {
                    return {
                        type: 'text',
                        content: h,
                        locked: true, // Start locked
                        unlockTime: new Date().toISOString() // Placeholder, updated in loop
                    };
                }
                return {
                    type: h.type || 'text',
                    content: h.content || '',
                    locked: true,
                    unlockTime: h.unlockTime || new Date().toISOString()
                };
            });

            // Append video solution if exists and not already in hints (check logic can be simple append)
            // Ideally we only append if it's not already handled by a pre-processing step (like API routes)
            // But since this runs on "problems" prop which can be raw or processed, let's check carefully.
            // Actually, if it's from API, hints might already include video.
            // If it's local (e.g. practice), p.hints is just array of text strings mostly.
            // We can check if any hint is of type 'video'.

            const hasVideoHint = hints.some(h => h.type === 'video');
            if (p.videoSolution && !hasVideoHint) {
                const index = hints.length;
                // Use consistent timing logic: 5 mins per hint
                // Or stick to what's defined for practice? Let's use 5 mins default.
                // We don't have problem.startedAt here easily for all cases (practice mode start time is complex)
                // But TestPlayer has internal timer. 
                // Actually this logic formats data for rendering. Unlock logic is separate usually?
                // No, TestPlayer usually relies on external time or passes it down.
                // For now, let's just add it. The unlock logic in render loop handles the time check.
                // We need to set a relative unlockTime that the separate timer can check against.
                // Or we can just set it and let the player handle it.
                // Actually TestPlayer doesn't have an internal "unlock scheduler" loop visible here?
                // It does generally rely on props or internal state.
                // Wait, TestPlayer.tsx lines 532+ iterates hints.
                // Let's just append it. The unlockTime needs to be set properly for the countdown.
                // If we don't have a startedAt reference here, we might need to rely on the Player to set it or 
                // set a placeholder that gets updated.
                // Let's assume relative time or just 0 for now if pre-processed. 
                // If raw, we set a placeholder.

                hints.push({
                    type: 'video',
                    content: p.videoSolution,
                    locked: true,
                    unlockTime: new Date(Date.now() + (index + 1) * 300000).toISOString() // Default 5 mins relative to NOW (init)
                });
            }

            return {
                ...p,
                type,
                defaultCode,
                webDevInitialCode,
                hints,
            };
        });
        setLocalProblems(processed as any);
    }, [problems]);

    const activeProblem = localProblems[activeProblemIndex] || ({} as Problem);

    // Initialize code (Wait for localProblems)
    useEffect(() => {
        if (localProblems.length === 0) return;
        const initialCodes: any = {};
        localProblems.forEach(p => {
            if (p.type === "WEB_DEV") {
                initialCodes[p.id] = [
                    { name: "index.html", language: "html", content: p.webDevInitialCode?.html || "" },
                    { name: "styles.css", language: "css", content: p.webDevInitialCode?.css || "" },
                    { name: "script.js", language: "javascript", content: p.webDevInitialCode?.js || "" }
                ];
            } else {
                initialCodes[p.id] = p.defaultCode?.[language] || (
                    language === "python" ? "# Write your code here" :
                        language === "cpp" ? "// Write your code here" :
                            "// Write your code here"
                );
            }
        });
        setUserCodes(initialCodes);
    }, [localProblems]);

    // Update code when language changes (only for coding problems)
    useEffect(() => {
        if (activeProblem.type !== "WEB_DEV") {
            setUserCodes(prev => ({
                ...prev,
                [activeProblem.id]: activeProblem.defaultCode?.[language] || prev[activeProblem.id]
            }));
        }
    }, [language, activeProblem]);

    // Timer (Stopwatch + Features)
    useEffect(() => {
        const timer = setInterval(() => {
            setElapsedTime(prev => prev + 1);

            // Ask AI Timer (7 minutes = 420 seconds)
            const aiUnlockTime = 7 * 60;
            // Since we use elapsedTime (seconds), compare directly
            // Wait, elapsedTime starts at 0. So we need to check if current time < 420.
            // But we need to use a Ref or access state inside interval.
            // Simplified: Calculate unlocking based on elapsedTime update using setElapsedTime callback?
            // No, we can just recalculate inside the SetElapsedTime or use a separate effect that depends on elapsedTime (might be too frequent re-renders if we put heavy logic).
            // Better: Do it all here. But we need access to `elapsedTime` value. 
            // We can use functional update for setElapsedTime and do side effects? No pure side effects in setter.
            // Let's rely on `elapsedTime` as dependency for a separate Effect or use Ref for time.
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Effect for Time-based Unlocking (Hints & AI)
    useEffect(() => {
        if (elapsedTime === 0 && localProblems.length === 0) return;

        // Ask AI Logic (7 mins = 420s)
        const remainingAi = (7 * 60) - elapsedTime;
        if (remainingAi <= 0) {
            setCanAskAi(true);
            setTimeToAi("");
        } else {
            setCanAskAi(false);
            const mins = Math.floor(remainingAi / 60);
            const secs = remainingAi % 60;
            setTimeToAi(`${mins}:${secs.toString().padStart(2, "0")}`);
        }

        // Progressive Hints Logic (Every 2 mins = 120s)
        setLocalProblems(prevProblems => {
            if (!prevProblems.length) return prevProblems;
            let changed = false;

            const newProblems = prevProblems.map(p => {
                const updatedHints = p.hints.map((h, idx) => {
                    const unlockForHint = (idx + 1) * 2 * 60; // 2m, 4m, 6m... (in seconds)
                    const isLocked = elapsedTime < unlockForHint;

                    if (isLocked !== h.locked) changed = true;
                    // Format relative countdown
                    const remaining = Math.max(0, unlockForHint - elapsedTime);
                    const m = Math.floor(remaining / 60);
                    const s = remaining % 60;
                    // Mock ISO string for compatibility if needed or Just use a display helper
                    // Storing a helper "unlockTime" string might be easier for UI reusing practice component logic?
                    // But here we are independent.

                    return { ...h, locked: isLocked, unlockTime: new Date(Date.now() + remaining * 1000).toISOString() };
                });
                return { ...p, hints: updatedHints };
            });

            if (!changed) return prevProblems;
            return newProblems;
        });

    }, [elapsedTime]); // Run every second when time updates

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const handleCodeChange = (value: string | undefined) => {
        setUserCodes(prev => ({ ...prev, [activeProblem.id]: value || "" }));
    };

    const handleWebDevFilesChange = (files: File[]) => {
        setUserCodes(prev => ({ ...prev, [activeProblem.id]: files }));
    };

    const parseErrorLine = (errorMessage: string, lang: Language): number | null => {
        if (lang === "python") {
            const matches = [...errorMessage.matchAll(/line (\d+)/gi)];
            if (matches.length > 0) return parseInt(matches[matches.length - 1][1], 10);
            return null;
        } else if (lang === "cpp") {
            const match = errorMessage.match(/:(\d+):\d+: error:/i) || errorMessage.match(/:(\d+):.*error:/i);
            return match ? parseInt(match[1], 10) : null;
        } else if (lang === "java") {
            const match = errorMessage.match(/:(\d+):.*error:/i);
            return match ? parseInt(match[1], 10) : null;
        }
        return null;
    };
    const [errorLine, setErrorLine] = useState<number | null>(null);

    const handleRun = async () => {
        setIsRunning(true);
        setStatus("running");
        setOutput("Running test cases...");
        setActiveTab("results");
        setErrorLine(null);

        const code = userCodes[activeProblem.id];
        let allPassed = true;
        let log = "";
        const detailedResults: any[] = [];

        for (const [idx, tc] of activeProblem.testCases.entries()) {
            try {
                const res = await fetch("/api/compile", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ language, code, input: tc.input }),
                });
                const data = await res.json();
                const actual = (data.output || "").trim();
                const expected = tc.expectedOutput.trim();

                if (data.error) {
                    log += `Case ${idx + 1}: Error\n${data.error}\n\n`;
                    allPassed = false;
                    const line = parseErrorLine(data.error, language);
                    if (line) setErrorLine(line);
                } else if (actual !== expected) {
                    log += `Case ${idx + 1}: Failed\nInput: ${tc.input}\nExpected: ${expected}\nActual: ${actual}\n\n`;
                    allPassed = false;
                } else {
                    log += `Case ${idx + 1}: Passed\n`;
                }

                detailedResults.push({
                    passed: !data.error && actual === expected,
                    input: tc.input,
                    expected: tc.expectedOutput,
                    actual: data.error || actual
                });

            } catch (e: any) {
                log += `Case ${idx + 1}: System Error\n`;
                allPassed = false;
                detailedResults.push({
                    passed: false,
                    input: tc.input,
                    expected: tc.expectedOutput,
                    actual: "System Error: " + e.message
                });
            }
        }

        setOutput(log);
        setStatus(allPassed ? "success" : "error");
        setIsRunning(false);

        // Update result for this problem
        setResults(prev => ({ ...prev, [activeProblem.id]: allPassed }));

        // Update Test Results Detail for UI
        setTestResults({
            passed: allPassed,
            score: allPassed ? 100 : 0,
            results: detailedResults
        });
    };

    // Ask AI Handler
    const handleAskAi = async (mode: "guide" | "solution") => {
        setIsAskingAi(true);
        try {
            const res = await fetch("/api/ask-ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    problemDescription: activeProblem.description,
                    studentCode: userCodes[activeProblem.id] as string,
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

    const handleSubmitTest = (auto = false) => {
        if (!auto && !confirm("Submit Test? This cannot be undone.")) return;

        const solvedCount = Object.values(results).filter(Boolean).length;
        const score = (solvedCount / problems.length) * 100;
        const passed = score >= passingScore;

        const durationSpent = elapsedTime; // Use actual elapsed time

        onComplete(passed, score, durationSpent);
    };

    const nextProblem = () => {
        if (activeProblemIndex < problems.length - 1) {
            setActiveProblemIndex(prev => prev + 1);
        }
    };

    const prevProblem = () => {
        if (activeProblemIndex > 0) {
            setActiveProblemIndex(prev => prev - 1);
        }
    };

    return (
        <div className="flex h-screen flex-col bg-[#0e0e0e] text-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-800 bg-[#161616] px-6 py-4">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className="text-xl font-bold">{activeProblem.title}</h1>
                        <p className="text-xs text-gray-400">Medium</p>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={prevProblem}
                            disabled={activeProblemIndex === 0}
                            className="rounded p-1 hover:bg-gray-800 disabled:opacity-30"
                        >
                            <ChevronDown className="rotate-90" size={20} />
                        </button>
                        <span className="text-sm font-medium text-gray-400">
                            Problem {activeProblemIndex + 1}/{problems.length}
                        </span>
                        <button
                            onClick={nextProblem}
                            disabled={activeProblemIndex === problems.length - 1}
                            className="rounded p-1 hover:bg-gray-800 disabled:opacity-30"
                        >
                            <ChevronDown className="-rotate-90" size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 rounded bg-gray-800 px-3 py-1 text-sm font-medium text-yellow-400">
                        <Clock size={16} />
                        {formatTime(elapsedTime)}
                    </div>

                    {activeProblem.type !== "WEB_DEV" && (
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as any)}
                            className="rounded border border-gray-700 bg-[#1e1e1e] px-3 py-1 text-sm"
                        >
                            <option value="java">Java</option>
                            <option value="python">Python</option>
                            <option value="cpp">C++</option>
                        </select>
                    )}

                    {activeProblem.type !== "WEB_DEV" && (
                        <button
                            onClick={handleRun}
                            disabled={isRunning}
                            className="rounded bg-blue-600 px-6 py-2 text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isRunning ? "Running..." : "Run"}
                        </button>
                    )}

                    <button
                        onClick={() => {
                            if (confirm("Reset code to default? Your changes will be lost.")) {
                                if (activeProblem.type === "WEB_DEV") {
                                    handleWebDevFilesChange([
                                        { name: "index.html", language: "html", content: activeProblem.webDevInitialCode?.html || "" },
                                        { name: "styles.css", language: "css", content: activeProblem.webDevInitialCode?.css || "" },
                                        { name: "script.js", language: "javascript", content: activeProblem.webDevInitialCode?.js || "" }
                                    ]);
                                    setActiveFileName("index.html");
                                } else {
                                    handleCodeChange(activeProblem.defaultCode?.[language]);
                                }
                            }
                        }}
                        className="rounded p-2 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                        title="Reset Code"
                    >
                        <RefreshCw size={20} />
                    </button>

                    <button
                        onClick={() => handleSubmitTest(false)}
                        className="rounded bg-green-600 px-6 py-2 text-sm font-bold hover:bg-green-700"
                    >
                        Submit Test
                    </button>
                </div>
            </div>

            {/* Main Content: Split View */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel: Problem Description */}
                <div className="w-1/3 border-r border-gray-800 bg-[#111111] flex flex-col">
                    <div className="flex items-center gap-2 border-b border-gray-800 bg-[#161616] px-4 py-2">
                        <FileText className="text-gray-400" size={16} />
                        <span className="text-sm font-bold text-gray-300">Description</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 text-sm text-gray-300">
                        <h2 className="mb-4 text-lg font-bold text-white">{problems[activeProblemIndex].title}</h2>
                        <div className="prose prose-invert max-w-none">
                            <ReactMarkdown rehypePlugins={[rehypeRaw]}>{problems[activeProblemIndex].description}</ReactMarkdown>
                        </div>

                        <div className="mt-8 space-y-4">
                            {/* Test Cases */}
                            {problems[activeProblemIndex].testCases.map((tc: any, i: number) => (
                                <div key={i} className="rounded bg-[#0e0e0e] p-3">
                                    <div className="mb-1 text-xs font-bold text-gray-500">Example {i + 1}</div>
                                    <div className="space-y-1 font-mono text-xs">
                                        <div>
                                            <span className="text-blue-400">Input:</span> {tc.input}
                                        </div>
                                        <div>
                                            <span className="text-green-400">Output:</span> {tc.expectedOutput || tc.output}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Hints */}
                            {activeProblem.hints && activeProblem.hints.length > 0 && (
                                <div className="mt-6">
                                    <div className="mb-2 flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-gray-300">Hints</h3>
                                        <span className="rounded-full bg-gray-800 px-2 py-0.5 text-[10px] text-gray-400">
                                            {activeProblem.hints.filter((h: any) => !h.locked).length}/{activeProblem.hints.length} unlocked
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {activeProblem.hints.map((hint: any, idx: number) => (
                                            <div key={idx} className="overflow-hidden rounded border border-gray-800 bg-[#161616]">
                                                <button
                                                    onClick={() => toggleHint(idx)}
                                                    className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-[#1e1e1e]"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-gray-300">Hint {idx + 1}</span>
                                                        {hint.type === "video" && (
                                                            <span className="flex items-center gap-1 rounded bg-blue-900/30 px-1.5 py-0.5 text-[10px] text-blue-400">
                                                                <Video size={10} /> Solution
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {hint.locked ? (
                                                            <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                                                <Lock size={10} />
                                                                <span>Unlocks in {formatTimeRemaining(hint.unlockTime)}</span>
                                                            </div>
                                                        ) : (
                                                            <ChevronDown size={14} className={cn("transition-transform text-gray-400", expandedHints.includes(idx) && "rotate-180")} />
                                                        )}
                                                    </div>
                                                </button>
                                                {expandedHints.includes(idx) && !hint.locked && (
                                                    <div className="border-t border-gray-800 bg-[#111111] p-3 text-xs text-gray-300">
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
                </div>

                {/* Right Panel: Editor (Top) + Console (Bottom) */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Top: Editor */}
                    <div className="flex-1 flex flex-col min-h-0 border-b border-gray-800">
                        <div className="flex items-center justify-between border-b border-gray-800 bg-[#161616] px-4 py-2">
                            <div className="flex items-center gap-2">
                                <Code className="text-blue-400" size={16} />
                                <span className="text-sm font-bold text-gray-300">Code Editor</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value as any)}
                                    className="rounded bg-[#0e0e0e] px-2 py-1 text-xs text-gray-300 border border-gray-700"
                                >
                                    <option value="python">Python</option>
                                    <option value="javascript">JavaScript</option>
                                    <option value="cpp">C++</option>
                                    <option value="java">Java</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden relative">
                            <div className="h-full w-full">
                                <CodeEditor
                                    language={language}
                                    code={userCodes[activeProblem.id] as string || ""}
                                    onChange={(val) => setUserCodes(prev => ({ ...prev, [activeProblem.id]: val || "" }))}
                                    errorLine={errorLine}
                                />
                            </div>
                            {/* Run Button Floating or fixed in header? Header is better but let's keep consistent */}
                            <div className="absolute bottom-4 right-4 z-10">
                                <button
                                    onClick={handleRun}
                                    disabled={isRunning}
                                    className={`flex items-center gap-2 rounded-full px-6 py-2 font-bold shadow-lg transition-all ${isRunning
                                        ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                        : "bg-green-600 text-white hover:bg-green-700 hover:scale-105"
                                        }`}
                                >
                                    <Play size={16} />
                                    {isRunning ? "Running..." : "Run Code"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Bottom: Console/Results */}
                    <div className="h-[35%] flex flex-col bg-[#0e0e0e]">
                        <div className="flex items-center gap-4 border-b border-gray-800 bg-[#161616] px-4">
                            <button
                                onClick={() => setActiveTab("console")}
                                className={`border-b-2 py-2 text-xs font-bold transition-colors ${activeTab === "console" ? "border-blue-500 text-blue-400" : "border-transparent text-gray-500 hover:text-gray-300"
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Terminal size={14} />
                                    Output
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab("results")}
                                className={`border-b-2 py-2 text-xs font-bold transition-colors ${activeTab === "results" ? "border-purple-500 text-purple-400" : "border-transparent text-gray-500 hover:text-gray-300"
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={14} />
                                    Test Results
                                </div>
                            </button>
                            <button
                                onClick={() => canAskAi && setActiveTab("ask-ai")}
                                className={`border-b-2 py-2 text-xs font-bold transition-colors flex items-center gap-2 ${activeTab === "ask-ai" ? "border-blue-500 text-blue-400" : "border-transparent text-gray-500 hover:text-gray-300"
                                    } ${!canAskAi ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                <span>Ask AI</span>
                                {!canAskAi && <span className="text-[10px]">({timeToAi})</span>}
                                {!canAskAi && <Lock size={12} />}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
                            {activeTab === "console" ? (
                                <div className="space-y-2">
                                    {output ? (
                                        <pre className="whitespace-pre-wrap text-gray-300">{output}</pre>
                                    ) : (
                                        <div className="text-gray-600 italic">Run your code to see output...</div>
                                    )}
                                </div>
                            ) : activeTab === "ask-ai" ? (
                                <div className="space-y-6">
                                    {!aiMessage ? (
                                        <div className="space-y-4">
                                            <div className="rounded border border-blue-900/30 bg-blue-900/10 p-4">
                                                <h3 className="mb-2 font-bold text-blue-400">Ask AI for Guidance</h3>
                                                <p className="text-xs text-gray-400">
                                                    Stuck? The AI can analyze your code and provide guidance without giving away the answer immediately.
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleAskAi("guide")}
                                                disabled={isAskingAi}
                                                className="w-full rounded bg-blue-600 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {isAskingAi ? "Analyzing..." : "Ask AI for Guidance"}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="rounded border border-gray-800 bg-[#161616] p-4">
                                                <h3 className="mb-2 font-bold text-gray-300">AI Suggestion</h3>
                                                <div className="prose prose-invert max-w-none text-sm text-gray-400 whitespace-pre-wrap">
                                                    {aiMessage}
                                                </div>
                                            </div>

                                            {showGiveAnswer && (
                                                <div className="rounded border border-yellow-900/30 bg-yellow-900/10 p-4">
                                                    <h3 className="mb-2 font-bold text-yellow-400">Still Stuck?</h3>
                                                    <p className="mb-4 text-xs text-gray-400">
                                                        If the guidance wasn't enough, you can ask for the full solution.
                                                    </p>
                                                    <button
                                                        onClick={() => handleAskAi("solution")}
                                                        disabled={isAskingAi}
                                                        className="w-full rounded border border-yellow-600 py-2 text-sm font-bold text-yellow-500 hover:bg-yellow-900/20 disabled:opacity-50"
                                                    >
                                                        {isAskingAi ? "Thinking..." : "Give me the Solution"}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {testResults ? (
                                        <>
                                            <div className={`flex items-center gap-2 text-sm font-bold ${testResults.passed ? "text-green-400" : "text-red-400"}`}>
                                                {testResults.passed ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                                <span>{testResults.passed ? "All Test Cases Passed!" : "Some Test Cases Failed"}</span>
                                            </div>
                                            <div className="space-y-2">
                                                {testResults.results.map((r: any, i: number) => (
                                                    <div key={i} className={`rounded p-2 border ${r.passed ? "border-green-900/50 bg-green-900/10" : "border-red-900/50 bg-red-900/10"}`}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-xs font-bold text-gray-400">Case {i + 1}</span>
                                                            {r.passed ? <span className="text-xs text-green-500">Passed</span> : <span className="text-xs text-red-500">Failed</span>}
                                                        </div>
                                                        {!r.passed && (
                                                            <div className="space-y-1 text-xs">
                                                                <div>Expected: <span className="text-gray-300">{r.expected}</span></div>
                                                                <div>Actual: <span className="text-red-300">{r.actual}</span></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-gray-600 italic">Run your code to check test cases...</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
