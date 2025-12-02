"use client";

import React, { useState, useEffect, useRef } from "react";
import { Clock, CheckCircle, XCircle, Play, Save } from "lucide-react";
import ComplexityAnalysis from "@/components/ComplexityAnalysis";
import CodeEditor from "@/components/CodeEditor";
import { ChevronDown, Lock, Video } from "lucide-react";
import { cn } from "@/lib/utils";

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
    const [userCodes, setUserCodes] = useState<{ [key: string]: string }>({});

    // Store results for each problem
    const [results, setResults] = useState<{ [key: string]: boolean }>({});

    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState("");
    const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");

    // AI Analysis State
    const [analysis, setAnalysis] = useState<{
        timeComplexity: string;
        spaceComplexity: string;
        reason: string;
        suggestion: string;
    } | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Hints State
    const [expandedHints, setExpandedHints] = useState<number[]>([]);

    const activeProblem = problems[activeProblemIndex];

    // Initialize code
    useEffect(() => {
        const initialCodes: any = {};
        problems.forEach(p => {
            // Parse defaultCode if string
            let defaultCode = p.defaultCode;
            if (typeof defaultCode === 'string') {
                try {
                    defaultCode = JSON.parse(defaultCode);
                } catch (e) {
                    defaultCode = { python: "", cpp: "", java: "" };
                }
            }

            // Parse hints if string
            if (typeof p.hints === 'string') {
                try {
                    p.hints = JSON.parse(p.hints);
                } catch (e) {
                    p.hints = [];
                }
            }

            initialCodes[p.id] = defaultCode?.[language] || (
                language === "python" ? "# Write your code here" :
                    language === "cpp" ? "// Write your code here" :
                        "// Write your code here"
            );
        });
        setUserCodes(initialCodes);
    }, [problems]);

    // Update code when language changes
    useEffect(() => {
        setUserCodes(prev => ({
            ...prev,
            [activeProblem.id]: activeProblem.defaultCode?.[language] || prev[activeProblem.id]
        }));
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

    // AI Analysis Effect
    useEffect(() => {
        const code = userCodes[activeProblem.id];
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
    }, [userCodes[activeProblem.id], language, activeProblem.id]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const handleCodeChange = (value: string | undefined) => {
        setUserCodes(prev => ({ ...prev, [activeProblem.id]: value || "" }));
    };

    const toggleHint = (index: number) => {
        setExpandedHints(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const handleRun = async () => {
        setIsRunning(true);
        setStatus("running");
        setOutput("Running test cases...");

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

    return (
        <div className="flex h-screen flex-col bg-[#0e0e0e] text-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-800 bg-[#161616] px-6 py-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold">Coding Test</h1>
                    <div className="flex items-center gap-2 rounded bg-gray-800 px-3 py-1 text-sm font-medium text-yellow-400">
                        <Clock size={16} />
                        {formatTime(timeLeft)}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as any)}
                        className="rounded border border-gray-700 bg-[#1e1e1e] px-3 py-1 text-sm"
                    >
                        <option value="java">Java</option>
                        <option value="python">Python</option>
                        <option value="cpp">C++</option>
                    </select>
                    <button
                        onClick={() => handleSubmitTest(false)}
                        className="rounded bg-green-600 px-4 py-2 text-sm font-bold hover:bg-green-700"
                    >
                        Submit Test
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar: Problems */}
                <div className="w-64 border-r border-gray-800 bg-[#111111] p-4">
                    <h3 className="mb-4 font-semibold text-gray-400">Problems</h3>
                    <div className="space-y-2">
                        {problems.map((p, idx) => (
                            <button
                                key={p.id}
                                onClick={() => setActiveProblemIndex(idx)}
                                className={cn(
                                    "flex w-full items-center justify-between rounded px-3 py-2 text-sm transition-colors",
                                    activeProblemIndex === idx ? "bg-blue-900/30 text-blue-400" : "text-gray-400 hover:bg-[#1e1e1e]",
                                    results[p.id] && "text-green-400"
                                )}
                            >
                                <span>{idx + 1}. {p.title}</span>
                                {results[p.id] && <CheckCircle size={14} />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex flex-1 flex-col">
                    {/* Problem Desc & Hints */}
                    <div className="h-1/3 overflow-y-auto border-b border-gray-800 p-6">
                        <div className="space-y-6">
                            <div>
                                <h2 className="mb-2 text-xl font-bold">{activeProblem.title}</h2>
                                <p className="text-gray-300 whitespace-pre-wrap">{activeProblem.description}</p>
                            </div>

                            {/* AI Analysis */}
                            <ComplexityAnalysis analysis={analysis} loading={isAnalyzing} />

                            {/* Hints */}
                            {activeProblem.hints && activeProblem.hints.length > 0 && (
                                <div>
                                    <h3 className="mb-3 text-lg font-semibold">Hints</h3>
                                    <div className="space-y-2">
                                        {activeProblem.hints.map((hint, idx) => (
                                            <div key={idx} className="overflow-hidden rounded-lg border border-gray-800 bg-[#161616]">
                                                <button
                                                    onClick={() => toggleHint(idx)}
                                                    className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-[#1e1e1e]"
                                                >
                                                    <span className="text-sm font-medium text-gray-300">Hint {idx + 1}</span>
                                                    <ChevronDown size={16} className={cn("transition-transform text-gray-400", expandedHints.includes(idx) && "rotate-180")} />
                                                </button>
                                                {expandedHints.includes(idx) && (
                                                    <div className="border-t border-gray-800 bg-[#111111] p-3 text-sm text-gray-300">
                                                        {hint}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Editor & Console */}
                    <div className="flex flex-1">
                        <div className="w-1/2 border-r border-gray-800 relative">
                            <CodeEditor
                                language={language}
                                code={userCodes[activeProblem.id] || ""}
                                onChange={handleCodeChange}
                            />
                            <button
                                onClick={handleRun}
                                disabled={isRunning}
                                className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-bold shadow-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                <Play size={16} /> Run
                            </button>
                        </div>
                        <div className="w-1/2 bg-[#111111] p-4 font-mono text-sm">
                            <div className="mb-2 text-xs font-bold text-gray-500 uppercase">Output</div>
                            <pre className={cn(
                                "whitespace-pre-wrap",
                                status === "error" ? "text-red-400" : "text-gray-300"
                            )}>
                                {output || "Run code to see output..."}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
