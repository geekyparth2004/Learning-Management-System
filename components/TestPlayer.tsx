"use client";

import React, { useState, useEffect } from "react";
import { Clock, CheckCircle, ChevronDown } from "lucide-react";
import CodeEditor from "@/components/CodeEditor";
import { cn } from "@/lib/utils";
import WebDevEditor from "./WebDevEditor";

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

interface Problem {
    id: string;
    title: string;
    description: string;
    defaultCode: any; // { python: string, cpp: string }
    testCases: TestCase[];
    hints: string[];
    type?: "CODING" | "WEB_DEV";
    webDevInstructions?: string;
    webDevInitialCode?: {
        html: string;
        css: string;
        js: string;
    };
}

interface TestPlayerProps {
    duration: number; // minutes
    passingScore: number; // percentage
    problems: Problem[];
    onComplete: (passed: boolean, score: number) => void;
}

export default function TestPlayer({ duration, passingScore, problems, onComplete }: TestPlayerProps) {
    const [timeLeft, setTimeLeft] = useState(duration * 60);
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
    const [activeTab, setActiveTab] = useState<"editor" | "console" | "results">("editor");

    const processedProblems = React.useMemo(() => {
        return problems.map(p => {
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

            let hints: string[] = [];
            if (Array.isArray(p.hints)) {
                hints = p.hints;
            } else if (typeof p.hints === 'string') {
                try {
                    hints = JSON.parse(p.hints);
                } catch (e) {
                    hints = [];
                }
            }

            return {
                ...p,
                type,
                defaultCode,
                webDevInitialCode,
                hints,
            };
        });
    }, [problems]);

    const activeProblem = processedProblems[activeProblemIndex];

    // Initialize code
    useEffect(() => {
        const initialCodes: any = {};
        processedProblems.forEach(p => {
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
    }, [processedProblems]);

    // Update code when language changes (only for coding problems)
    useEffect(() => {
        if (activeProblem.type !== "WEB_DEV") {
            setUserCodes(prev => ({
                ...prev,
                [activeProblem.id]: activeProblem.defaultCode?.[language] || prev[activeProblem.id]
            }));
        }
    }, [language, activeProblem]);

    // Timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmitTest(true); // Auto submit
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

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

    const handleRun = async () => {
        if (activeProblem.type === "WEB_DEV") return;

        setIsRunning(true);
        setStatus("running");
        setOutput("Running test cases...");
        setActiveTab("results"); // Switch to results tab

        const code = userCodes[activeProblem.id];
        let allPassed = true;
        let log = "";

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
                } else if (actual !== expected) {
                    log += `Case ${idx + 1}: Failed\nInput: ${tc.input}\nExpected: ${expected}\nActual: ${actual}\n\n`;
                    allPassed = false;
                } else {
                    log += `Case ${idx + 1}: Passed\n`;
                }
            } catch (e) {
                log += `Case ${idx + 1}: System Error\n`;
                allPassed = false;
            }
        }

        setOutput(log);
        setStatus(allPassed ? "success" : "error");
        setIsRunning(false);

        // Update result for this problem
        setResults(prev => ({ ...prev, [activeProblem.id]: allPassed }));
    };

    const handleSubmitTest = (auto = false) => {
        if (!auto && !confirm("Submit Test? This cannot be undone.")) return;

        const solvedCount = Object.values(results).filter(Boolean).length;
        const score = (solvedCount / problems.length) * 100;
        const passed = score >= passingScore;

        onComplete(passed, score);
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
                        {formatTime(timeLeft)}
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
                        onClick={() => handleSubmitTest(false)}
                        className="rounded bg-green-600 px-6 py-2 text-sm font-bold hover:bg-green-700"
                    >
                        Submit Test
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {activeProblem.type === "WEB_DEV" ? (
                    <div className="w-full h-full flex flex-col">
                        <div className="flex-1 overflow-hidden">
                            <WebDevEditor
                                files={userCodes[activeProblem.id] as File[] || []}
                                setFiles={handleWebDevFilesChange}
                                instructions={activeProblem.webDevInstructions || ""}
                                activeFileName={activeFileName}
                                setActiveFileName={setActiveFileName}
                            />
                        </div>
                        <div className="border-t border-gray-800 bg-[#161616] p-2 flex justify-end">
                            <button
                                onClick={() => setResults(prev => ({ ...prev, [activeProblem.id]: true }))}
                                className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-bold hover:bg-blue-700"
                            >
                                <CheckCircle size={16} /> Mark as Completed
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Left Panel: Description & Test Cases */}
                        <div className="w-1/2 flex flex-col border-r border-gray-800">
                            <div className="flex-1 overflow-y-auto p-6">
                                <h2 className="mb-4 text-lg font-bold">Problem Description</h2>
                                <p className="mb-8 text-gray-300 whitespace-pre-wrap leading-relaxed">
                                    {activeProblem.description}
                                </p>

                                <h2 className="mb-4 text-lg font-bold">Test Cases</h2>
                                <div className="space-y-4">
                                    {activeProblem.testCases.map((tc, idx) => (
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

                        {/* Right Panel: Editor & Console */}
                        <div className="w-1/2 flex flex-col bg-[#111111]">
                            {/* Tabs */}
                            <div className="flex border-b border-gray-800 bg-[#161616]">
                                <button
                                    onClick={() => setActiveTab("editor")}
                                    className={cn(
                                        "px-6 py-3 text-sm font-medium transition-colors border-b-2",
                                        activeTab === "editor" ? "border-blue-500 text-white" : "border-transparent text-gray-400 hover:text-white"
                                    )}
                                >
                                    Editor
                                </button>
                                <button
                                    onClick={() => setActiveTab("console")}
                                    className={cn(
                                        "px-6 py-3 text-sm font-medium transition-colors border-b-2",
                                        activeTab === "console" ? "border-blue-500 text-white" : "border-transparent text-gray-400 hover:text-white"
                                    )}
                                >
                                    Console
                                </button>
                                <button
                                    onClick={() => setActiveTab("results")}
                                    className={cn(
                                        "px-6 py-3 text-sm font-medium transition-colors border-b-2",
                                        activeTab === "results" ? "border-blue-500 text-white" : "border-transparent text-gray-400 hover:text-white"
                                    )}
                                >
                                    Test Results
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="flex-1 overflow-hidden relative">
                                <div className={cn("h-full w-full", activeTab === "editor" ? "block" : "hidden")}>
                                    <CodeEditor
                                        language={language}
                                        code={userCodes[activeProblem.id] as string || ""}
                                        onChange={handleCodeChange}
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
                    </>
                )}
            </div>
        </div>
    );
}
