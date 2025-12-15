"use client";

import React, { useState, useEffect } from "react";
import { Clock, CheckCircle, ChevronDown, Trophy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import CodeEditor from "@/components/CodeEditor";
import { cn } from "@/lib/utils";
import { Language } from "@/types";

interface ContestPlayerProps {
    contest: any;
    problems: any[];
    endTime: string | Date;
    onLeave: () => void;
}

export default function ContestPlayer({ contest, problems, endTime, onLeave }: ContestPlayerProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Auto-enter Fullscreen
        const enterFullScreen = async () => {
            try {
                if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                } else if ((document.documentElement as any).webkitRequestFullscreen) {
                    await (document.documentElement as any).webkitRequestFullscreen();
                }
            } catch (err) {
                console.log("Error attempting to enable full-screen mode:", err);
            }
        };
        enterFullScreen();
    }, []);

    const handleLeave = async () => {
        try {
            if (document.fullscreenElement) {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if ((document as any).webkitExitFullscreen) {
                    await (document as any).webkitExitFullscreen();
                }
            }
        } catch (err) {
            console.error("Error attempting to exit full-screen mode:", err);
        }
        onLeave();
    };

    // Timer Logic
    const [timeLeft, setTimeLeft] = useState(0);

    // Auto-finish when time runs out
    const autoFinish = async () => {
        try {
            await fetch(`/api/contest/${contest.id}/finish`, { method: "POST" });
        } catch (e) { }
        handleLeave();
    };

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const end = new Date(endTime);
            const diff = Math.floor((end.getTime() - now.getTime()) / 1000);
            if (diff <= 0) {
                setTimeLeft(0);
                clearInterval(interval);
                autoFinish();
            } else {
                setTimeLeft(diff);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [endTime, onLeave]);

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    // State
    const [activeProblemIndex, setActiveProblemIndex] = useState(0);
    const activeProblem = problems && problems.length > 0 ? problems[activeProblemIndex] : null;
    const [language, setLanguage] = useState<Language>("java");

    const [userCodes, setUserCodes] = useState<{ [key: string]: string }>({});

    // UI states matching TestPlayer
    const [activeTab, setActiveTab] = useState<"editor" | "console" | "results">("editor");
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState("");
    const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");
    const [results, setResults] = useState<{ [key: string]: boolean }>({});

    // Initialize Code safely
    useEffect(() => {
        if (problems && mounted) {
            const codes: any = {};
            problems.forEach(p => {
                try {
                    if (p.defaultCode && typeof p.defaultCode === 'string' && !p.defaultCode.includes("html")) {
                        const parsed = JSON.parse(p.defaultCode);
                        codes[p.id] = parsed?.[language] || "";
                    } else {
                        codes[p.id] = "";
                    }
                } catch (e) {
                    codes[p.id] = "";
                }
            });
            setUserCodes(prev => {
                const next = { ...prev };
                Object.keys(codes).forEach(key => {
                    if (next[key] === undefined) next[key] = codes[key];
                });
                return next;
            });
        }
    }, [problems, language, mounted]);

    // Handle initial code update when switching problems
    useEffect(() => {
        if (mounted && activeProblem && userCodes[activeProblem.id] === undefined) {
            let defaults: any = { python: "", java: "", cpp: "" };
            try {
                if (activeProblem.defaultCode) {
                    defaults = JSON.parse(activeProblem.defaultCode);
                    if (!defaults) defaults = { python: "", java: "", cpp: "" };
                }
            } catch (e) {
                defaults = { python: "", java: "", cpp: "" };
            }

            setUserCodes(prev => ({
                ...prev,
                [activeProblem.id]: defaults?.[language] || ""
            }));
        }
    }, [activeProblem, language, userCodes, mounted]);


    // Parse Error Line
    const parseErrorLine = (errorMessage: string, lang: Language): number | null => {
        if (lang === "python") {
            const matches = [...errorMessage.matchAll(/line (\d+)/gi)];
            if (matches.length > 0) return parseInt(matches[matches.length - 1][1], 10);
            return null;
        } else if (lang === "cpp") {
            const match = errorMessage.match(/:(\d+):\d+: error:/i) || errorMessage.match(/:(\d+):.*error:/i);
            return match ? parseInt(match[1], 10) : null;
        } else if (lang === "java") {
            const match = errorMessage.match(/.java:(\d+): error:/i);
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

        try {
            const testCases = activeProblem.testCases || [];
            for (const [idx, tc] of testCases.entries()) {
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
            }
        } catch (e) {
            log += "System Error";
            allPassed = false;
        }

        setOutput(log);
        setStatus(allPassed ? "success" : "error");
        setIsRunning(false);

        if (allPassed) {
            setResults(prev => ({ ...prev, [activeProblem.id]: true }));
            // Do not auto-submit on simple Run, only if user explicitly submits or if we want auto-submit logic like TestPlayer.
            // For contest, let's keep it manual "Submit" usually, but here we can stick to previous logic or just track local success.
            // Keeping previous logic:
            // await submitSolution(true); 
        }
    };

    const handleExplicitSubmit = async () => {
        // Run verification first
        await handleRun();
        // Then actually submit
        await submitSolution(true); // Assumption: Submit counts even if failed? Or only if passed? 
        // Logic: handleRun updates 'status'. We should probably submit based on that result.
        // For now, let's reuse submitSolution which sends explicit 'passed' boolean.
    };

    const handleFinishContest = async () => {
        if (!confirm("Are you sure you want to finish the contest? You cannot re-enter.")) return;

        try {
            await fetch(`/api/contest/${contest.id}/finish`, {
                method: "POST"
            });
            handleLeave();
        } catch (e) {
            console.error("Finish failed", e);
            alert("Failed to submit contest. Please try again.");
        }
    };

    const submitSolution = async (passed: boolean) => {
        try {
            await fetch(`/api/contest/${contest.id}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    problemId: activeProblem.id,
                    code: userCodes[activeProblem.id],
                    language,
                    passed
                })
            });
            if (passed) alert("Solution Submitted!");
        } catch (e) {
            console.error("Submission failed", e);
        }
    };

    if (!mounted) {
        return <div className="flex h-screen items-center justify-center bg-[#0e0e0e] text-white">Loading Contest Environment...</div>;
    }

    if (!activeProblem) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0e0e0e] text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">No Problems Found</h1>
                    <button onClick={handleLeave} className="text-red-400 hover:text-red-300">Leave Contest</button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen flex-col bg-[#0e0e0e] text-white">
            <div className="flex items-center justify-between border-b border-gray-800 bg-[#161616] px-6 py-4">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className="text-xl font-bold">{contest.title}</h1>
                        <p className="text-xs text-gray-400">Problem: {activeProblem?.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setActiveProblemIndex(Math.max(0, activeProblemIndex - 1))}
                            disabled={activeProblemIndex === 0}
                            className="rounded p-1 hover:bg-gray-800 disabled:opacity-30"
                        >
                            <ChevronDown className="rotate-90" size={20} />
                        </button>
                        <span className="text-sm font-medium text-gray-400">
                            {activeProblemIndex + 1}/{problems.length}
                        </span>
                        <button
                            onClick={() => setActiveProblemIndex(Math.min(problems.length - 1, activeProblemIndex + 1))}
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
                        {formatTime(timeLeft)}
                    </div>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as Language)}
                        className="rounded border border-gray-700 bg-[#1e1e1e] px-3 py-1 text-sm"
                    >
                        <option value="java">Java</option>
                        <option value="python">Python</option>
                        <option value="cpp">C++</option>
                    </select>

                    <button
                        onClick={handleRun}
                        disabled={isRunning}
                        className="rounded bg-gray-700 px-6 py-2 text-sm font-bold hover:bg-gray-600 disabled:opacity-50"
                    >
                        {isRunning ? "Running..." : "Run"}
                    </button>

                    <button
                        onClick={handleFinishContest}
                        className="rounded bg-green-600 px-6 py-2 text-sm font-bold hover:bg-green-700 disabled:opacity-50"
                    >
                        Submit Contest
                    </button>

                    <button onClick={handleLeave} className="text-sm text-red-400 hover:text-red-300">
                        Leave Contest
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className="w-1/2 flex flex-col border-r border-gray-800">
                    <div className="flex-1 overflow-y-auto p-6">
                        <h2 className="text-xl font-bold mb-4">{activeProblem?.title}</h2>
                        <div className="mb-2 text-xs font-bold text-gray-500 uppercase">Description</div>
                        <div className="prose prose-invert max-w-none text-sm text-gray-300 mb-8">
                            <ReactMarkdown rehypePlugins={[rehypeRaw]}>{activeProblem?.description}</ReactMarkdown>
                        </div>

                        {/* Test Cases display like TestPlayer */}
                        <h2 className="mb-4 text-lg font-bold">Test Cases</h2>
                        <div className="space-y-4">
                            {activeProblem.testCases && activeProblem.testCases.map((tc: any, idx: number) => (
                                <div key={idx} className="rounded-lg border border-gray-800 bg-[#161616] p-4">
                                    <div className="mb-2 text-xs font-bold text-gray-500 uppercase">Case {idx + 1}</div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Input:</div>
                                            <div className="rounded bg-[#111111] p-2 font-mono text-sm text-gray-300">
                                                {tc.input}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Expected Output:</div>
                                            <div className="rounded bg-[#111111] p-2 font-mono text-sm text-gray-300">
                                                {tc.expectedOutput}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="w-1/2 flex flex-col bg-[#111111]">
                    <div className="flex border-b border-gray-800 bg-[#161616]">
                        <button
                            onClick={() => setActiveTab("editor")}
                            className={cn("px-6 py-3 border-b-2 text-sm font-medium transition-colors", activeTab === "editor" ? "border-blue-500 text-white" : "border-transparent text-gray-400 hover:text-white")}
                        >
                            Editor
                        </button>
                        <button
                            onClick={() => setActiveTab("console")}
                            className={cn("px-6 py-3 border-b-2 text-sm font-medium transition-colors", activeTab === "console" ? "border-blue-500 text-white" : "border-transparent text-gray-400 hover:text-white")}
                        >
                            Console
                        </button>
                        <button
                            onClick={() => setActiveTab("results")}
                            className={cn("px-6 py-3 border-b-2 text-sm font-medium transition-colors", activeTab === "results" ? "border-blue-500 text-white" : "border-transparent text-gray-400 hover:text-white")}
                        >
                            Test Results
                        </button>
                    </div>

                    <div className="flex-1 relative overflow-hidden">
                        <div className={cn("h-full w-full", activeTab === "editor" ? "block" : "hidden")}>
                            <CodeEditor
                                language={language}
                                code={userCodes[activeProblem.id] || ""}
                                onChange={(val) => setUserCodes(prev => ({ ...prev, [activeProblem.id]: val || "" }))}
                                errorLine={errorLine}
                            />
                        </div>

                        <div className={cn("h-full w-full p-4 overflow-y-auto", activeTab === "console" ? "block" : "hidden")}>
                            <div className="font-mono text-sm text-gray-300 whitespace-pre-wrap">
                                {output || "Run code to see output..."}
                            </div>
                        </div>

                        <div className={cn("h-full w-full p-4 overflow-y-auto", activeTab === "results" ? "block" : "hidden")}>
                            {status === "idle" && (
                                <div className="text-gray-500 text-center mt-10">Run your code to see results</div>
                            )}
                            {status !== "idle" && (
                                <div className="space-y-2">
                                    <div className={cn(
                                        "p-3 rounded border mb-4",
                                        status === "success" ? "border-green-900 bg-green-900/20 text-green-400" :
                                            status === "error" ? "border-red-900 bg-red-900/20 text-red-400" :
                                                "border-blue-900 bg-blue-900/20 text-blue-400"
                                    )}>
                                        {status === "running" ? "Running Tests..." :
                                            status === "success" ? "All Test Cases Passed!" : "Some Test Cases Failed"}
                                    </div>
                                    <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap bg-[#0e0e0e] p-4 rounded border border-gray-800">
                                        {output}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
