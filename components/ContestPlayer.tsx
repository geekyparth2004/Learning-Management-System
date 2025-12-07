"use client";

import React, { useState, useEffect } from "react";
import { Clock, CheckCircle, ChevronDown, Trophy } from "lucide-react";
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
    // Timer Logic
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const end = new Date(endTime);
            const diff = Math.floor((end.getTime() - now.getTime()) / 1000);
            if (diff <= 0) {
                setTimeLeft(0);
                clearInterval(interval);
                alert("Contest Ended!");
                onLeave();
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

    const [results, setResults] = useState<{ [key: string]: boolean }>({});
    const [activeTab, setActiveTab] = useState<"editor" | "console" | "results">("editor");
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState("");
    const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");

    // Initialize Code safely
    useEffect(() => {
        if (problems) {
            const codes: any = {};
            problems.forEach(p => {
                try {
                    if (p.defaultCode && !p.defaultCode.includes("html")) {
                        const parsed = JSON.parse(p.defaultCode);
                        codes[p.id] = parsed[language] || "";
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
    }, [problems, language]);

    // Handle initial code update when switching problems
    useEffect(() => {
        if (activeProblem && userCodes[activeProblem.id] === undefined) {
            let defaults = { python: "", java: "", cpp: "" };
            try { defaults = JSON.parse(activeProblem.defaultCode); } catch (e) { }
            setUserCodes(prev => ({ ...prev, [activeProblem.id]: defaults[language as keyof typeof defaults] || "" }));
        }
    }, [activeProblem, language, userCodes]);


    const handleRun = async () => {
        setIsRunning(true);
        setStatus("running");
        setOutput("Running test cases...");
        setActiveTab("results");

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
            await submitSolution(true);
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
        } catch (e) {
            console.error("Submission failed", e);
        }
    };

    if (!activeProblem) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0e0e0e] text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">No Problems Found</h1>
                    <button onClick={onLeave} className="text-red-400 hover:text-red-300">Leave Contest</button>
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
                        className="rounded bg-blue-600 px-6 py-2 text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isRunning ? "Running..." : "Submit"}
                    </button>

                    <button onClick={onLeave} className="text-sm text-red-400 hover:text-red-300">
                        Leave Contest
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className="w-1/2 flex flex-col border-r border-gray-800 p-6 overflow-y-auto">
                    <h2 className="text-2xl font-bold mb-4">{activeProblem?.title}</h2>
                    <p className="text-gray-300 whitespace-pre-wrap">{activeProblem?.description}</p>
                </div>

                <div className="w-1/2 flex flex-col bg-[#111111]">
                    <div className="flex border-b border-gray-800 bg-[#161616]">
                        <button onClick={() => setActiveTab("editor")} className={cn("px-6 py-3 border-b-2 text-sm", activeTab === "editor" ? "border-blue-500 text-white" : "border-transparent text-gray-400")}>Editor</button>
                        <button onClick={() => setActiveTab("results")} className={cn("px-6 py-3 border-b-2 text-sm", activeTab === "results" ? "border-blue-500 text-white" : "border-transparent text-gray-400")}>Results</button>
                    </div>

                    <div className="flex-1 relative">
                        {activeTab === "editor" && (
                            <CodeEditor
                                language={language}
                                code={userCodes[activeProblem.id] || ""}
                                onChange={(val) => setUserCodes(prev => ({ ...prev, [activeProblem.id]: val || "" }))}
                            />
                        )}
                        {activeTab === "results" && (
                            <div className="p-4 font-mono text-sm text-gray-300 whitespace-pre-wrap">
                                {status === "idle" ? "Run your code to see results." : output}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
