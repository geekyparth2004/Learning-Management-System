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
    onComplete: (passed: boolean, score: number, durationSpent: number) => void;
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
    const [activeTab, setActiveTab] = useState<"console" | "results">("console");
    const [testResults, setTestResults] = useState<any>(null);

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
                    const parsed = JSON.parse(p.hints);
                    hints = Array.isArray(parsed) ? parsed : [];
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
        setActiveTab("results");

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
                const passed = !data.error && actual === expected;

                if (!passed) allPassed = false;

                if (data.error) {
                    log += `Case ${idx + 1}: Error\n${data.error}\n\n`;
                } else if (!passed) {
                    log += `Case ${idx + 1}: Failed\nInput: ${tc.input}\nExpected: ${expected}\nActual: ${actual}\n\n`;
                } else {
                    log += `Case ${idx + 1}: Passed\n`;
                }

                detailedResults.push({
                    passed,
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

    const handleSubmitTest = (auto = false) => {
        if (!auto && !confirm("Submit Test? This cannot be undone.")) return;

        const solvedCount = Object.values(results).filter(Boolean).length;
        const score = (solvedCount / problems.length) * 100;
        const passed = score >= passingScore;

        const durationSpent = (duration * 60) - timeLeft; // Calculate time spent in seconds

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

            {/* Main Content: Split View */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel: Problem Description */}
                <div className="w-1/3 border-r border-gray-800 bg-[#111111] flex flex-col">
                    <div className="flex items-center gap-2 border-b border-gray-800 bg-[#161616] px-4 py-2">
                        <FileText className="text-gray-400" size={16} />
                        <span className="text-sm font-bold text-gray-300">Description</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 text-sm text-gray-300">
                        <h2 className="mb-4 text-lg font-bold text-white">{problems[currentProblemIndex].title}</h2>
                        <div className="prose prose-invert max-w-none">
                            <p>{problems[currentProblemIndex].description}</p>
                        </div>

                        <div className="mt-8 space-y-4">
                            {problems[currentProblemIndex].testCases.map((tc: any, i: number) => (
                                <div key={i} className="rounded bg-[#0e0e0e] p-3">
                                    <div className="mb-1 text-xs font-bold text-gray-500">Example {i + 1}</div>
                                    <div className="space-y-1 font-mono text-xs">
                                        <div>
                                            <span className="text-blue-400">Input:</span> {tc.input}
                                        </div>
                                        <div>
                                            <span className="text-green-400">Output:</span> {tc.output}
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                                    onChange={(e) => setLanguage(e.target.value)}
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
                            <Editor
                                height="100%"
                                language={language === "c++" ? "cpp" : language}
                                theme="vs-dark"
                                value={code}
                                onChange={(val) => setCode(val || "")}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    scrollBeyondLastLine: false,
                                    padding: { top: 16 },
                                }}
                            />
                            {/* Run Button Floating or fixed in header? Header is better but let's keep consistent */}
                            <div className="absolute bottom-4 right-4 z-10">
                                <button
                                    onClick={runCode}
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
