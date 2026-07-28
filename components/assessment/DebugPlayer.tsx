"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Bug, Loader2, Play, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import CodeEditor from "@/components/CodeEditor";

interface TestCase {
    input: string;
    expectedOutput: string;
    isHidden: boolean;
}

interface DebugChallenge {
    title: string;
    description: string;
    buggyCode: string;
    testCases: TestCase[];
}

export interface DebugRoundResult {
    score: number;
    maxScore: number;
    solved: number;
    total: number;
    language: string;
    challenges: {
        title: string;
        passed: boolean;
        passedCount: number;
        testCaseCount: number;
        finalCode: string;
        testResults: { input: string; expected: string; actual: string; passed: boolean; isHidden: boolean; error?: string }[];
    }[];
}

interface DebugPlayerProps {
    level: number;
    challengeCount: number;
    language: "python" | "java" | "cpp";
    onComplete: (result: DebugRoundResult) => void;
}

const LANG_LABELS: Record<string, string> = { python: "Python", java: "Java", cpp: "C++" };

export default function DebugPlayer({ level, challengeCount, language, onComplete }: DebugPlayerProps) {
    const [challenges, setChallenges] = useState<DebugChallenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [activeIndex, setActiveIndex] = useState(0);
    // The student's (edited) code per challenge, seeded with the buggy code
    const [codeMap, setCodeMap] = useState<Record<number, string>>({});
    const [resultMap, setResultMap] = useState<Record<number, { passed: boolean; results: any[] }>>({});
    const [isRunning, setIsRunning] = useState(false);
    const [showTestResults, setShowTestResults] = useState(false);

    useEffect(() => {
        let cancelled = false;
        async function loadChallenges() {
            try {
                const res = await fetch("/api/assessment/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: "debug", level, challengeCount, language }),
                });
                const data = await res.json();
                if (cancelled) return;
                if (data.error) {
                    setError(data.error);
                } else {
                    const items: DebugChallenge[] = data.challenges || [];
                    setChallenges(items);
                    const initial: Record<number, string> = {};
                    items.forEach((c, idx) => { initial[idx] = c.buggyCode || ""; });
                    setCodeMap(initial);
                }
            } catch (err: any) {
                if (!cancelled) setError(err.message || "Failed to load debug challenges");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        loadChallenges();
        return () => { cancelled = true; };
    }, [level, challengeCount, language]);

    const currentCode = codeMap[activeIndex] || "";

    const handleCodeChange = useCallback((val: string | undefined) => {
        if (val === undefined) return;
        setCodeMap(prev => ({ ...prev, [activeIndex]: val }));
    }, [activeIndex]);

    function resetCode() {
        const original = challenges[activeIndex]?.buggyCode || "";
        setCodeMap(prev => ({ ...prev, [activeIndex]: original }));
    }

    async function runCode() {
        const challenge = challenges[activeIndex];
        if (!challenge) return;

        setIsRunning(true);
        setShowTestResults(true);

        const testResults: any[] = [];
        let allPassed = true;

        for (const tc of challenge.testCases) {
            try {
                const res = await fetch("/api/compile", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ language, code: currentCode, input: tc.input }),
                });
                const data = await res.json();
                const actualOutput = (data.output || "").trim();
                const expectedOutput = (tc.expectedOutput || "").trim();
                const passed = actualOutput === expectedOutput;
                if (!passed) allPassed = false;

                testResults.push({
                    input: tc.input,
                    expected: expectedOutput,
                    actual: actualOutput,
                    passed,
                    isHidden: tc.isHidden,
                    error: data.error,
                });
            } catch (err: any) {
                allPassed = false;
                testResults.push({
                    input: tc.input,
                    expected: tc.expectedOutput,
                    actual: "",
                    passed: false,
                    isHidden: tc.isHidden,
                    error: err.message,
                });
            }
        }

        setResultMap(prev => ({
            ...prev,
            [activeIndex]: { passed: allPassed, results: testResults },
        }));
        setIsRunning(false);
    }

    function finishDebugging() {
        // +5 marks per challenge whose latest run passes every test case
        const solved = challenges.filter((_, idx) => resultMap[idx]?.passed).length;
        onComplete({
            score: solved * 5,
            maxScore: challenges.length * 5,
            solved,
            total: challenges.length,
            language,
            challenges: challenges.map((c, idx) => {
                const run = resultMap[idx];
                const testResults = run?.results || [];
                return {
                    title: c.title,
                    passed: !!run?.passed,
                    passedCount: testResults.filter((r: any) => r.passed).length,
                    testCaseCount: c.testCases.length,
                    finalCode: codeMap[idx] || c.buggyCode || "",
                    testResults,
                };
            }),
        });
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-orange-400" />
                <p className="text-gray-400">AI is planting bugs in {challengeCount} {LANG_LABELS[language]} program{challengeCount === 1 ? "" : "s"} at Level {level}...</p>
                <p className="text-xs text-gray-500">This may take 15-20 seconds</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
                <div className="text-center space-y-4 p-8">
                    <p className="text-red-400 text-lg">{error}</p>
                    <button onClick={() => window.location.reload()} className="rounded-lg bg-gray-800 px-6 py-2 text-white hover:bg-gray-700">Retry</button>
                </div>
            </div>
        );
    }

    if (challenges.length === 0) {
        return (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
                <p className="text-gray-400">No debug challenges generated.</p>
            </div>
        );
    }

    const activeChallenge = challenges[activeIndex];

    return (
        <div className="flex flex-col h-[calc(100vh-3.5rem)]">
            {/* Challenge tabs */}
            <div className="flex items-center gap-2 border-b border-gray-800 px-4 py-2 overflow-x-auto">
                {challenges.map((c, idx) => {
                    const result = resultMap[idx];
                    return (
                        <button key={idx} onClick={() => { setActiveIndex(idx); setShowTestResults(false); }}
                            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                                idx === activeIndex
                                    ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                            }`}
                        >
                            {result?.passed ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> :
                             result ? <XCircle className="h-3.5 w-3.5 text-red-400" /> :
                             <Bug className="h-3.5 w-3.5" />}
                            Challenge {idx + 1}
                        </button>
                    );
                })}

                <div className="ml-auto flex items-center gap-2">
                    <button onClick={finishDebugging}
                        className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-green-500"
                    >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Finish Debug Round
                    </button>
                </div>
            </div>

            {/* Split view */}
            <div className="flex flex-1 min-h-0">
                {/* Left: what the program should do */}
                <div className="w-1/2 border-r border-gray-800 overflow-y-auto p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <Bug className="h-5 w-5 text-orange-400" />
                        <h2 className="text-xl font-bold text-white">{activeChallenge.title}</h2>
                    </div>
                    <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-3 text-xs text-orange-300">
                        The code on the right contains planted bug{level >= 7 ? "s" : "(s)"} — syntax, logic, or both.
                        Fix the code so it does what the description says, then Run &amp; Test. Passing every test case earns +5 marks.
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-300 whitespace-pre-wrap">
                        {activeChallenge.description}
                    </div>

                    {/* Visible test cases */}
                    <div className="space-y-2">
                        <h3 className="font-bold text-gray-300 text-sm">Sample Test Cases</h3>
                        {activeChallenge.testCases.filter(tc => !tc.isHidden).map((tc, idx) => (
                            <div key={idx} className="rounded-lg border border-gray-800 bg-[#111111] p-3 space-y-1 text-sm">
                                <div><span className="text-gray-500">Input:</span> <code className="text-blue-300">{tc.input}</code></div>
                                <div><span className="text-gray-500">Output:</span> <code className="text-green-300">{tc.expectedOutput}</code></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: the buggy code to fix */}
                <div className="w-1/2 flex flex-col">
                    <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
                        <span className="rounded-lg border border-gray-800 bg-[#111111] px-3 py-1.5 text-sm text-gray-300">
                            {LANG_LABELS[language]}
                        </span>
                        <div className="flex items-center gap-2">
                            <button onClick={resetCode}
                                className="flex items-center gap-1.5 rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700"
                                title="Restore the original buggy code"
                            >
                                <RotateCcw className="h-3.5 w-3.5" /> Reset
                            </button>
                            <button onClick={runCode} disabled={isRunning}
                                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-green-500 disabled:opacity-50"
                            >
                                {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                                {isRunning ? "Running..." : "Run & Test"}
                            </button>
                        </div>
                    </div>

                    {/* Editor */}
                    <div className="flex-1 min-h-0">
                        <CodeEditor
                            language={language}
                            code={currentCode}
                            onChange={handleCodeChange}
                        />
                    </div>

                    {/* Test results */}
                    {showTestResults && resultMap[activeIndex] && (
                        <div className="border-t border-gray-800 max-h-[200px] overflow-y-auto p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-gray-300">Test Results</h4>
                                {resultMap[activeIndex].passed && (
                                    <span className="flex items-center gap-1 text-xs font-bold text-green-400">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> All bugs fixed! +5 marks
                                    </span>
                                )}
                            </div>
                            {resultMap[activeIndex].results.map((r, idx) => (
                                <div key={idx} className={`rounded-lg border p-2 text-xs ${
                                    r.passed ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
                                }`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        {r.passed ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> : <XCircle className="h-3.5 w-3.5 text-red-400" />}
                                        <span className={r.passed ? "text-green-400" : "text-red-400"}>
                                            {r.isHidden ? "Hidden " : ""}Test Case {idx + 1}: {r.passed ? "Passed" : "Failed"}
                                        </span>
                                    </div>
                                    {!r.isHidden && !r.passed && (
                                        <div className="ml-5 space-y-0.5 text-gray-400">
                                            <div>Expected: <code className="text-green-300">{r.expected}</code></div>
                                            <div>Got: <code className="text-red-300">{r.actual || "(empty)"}</code></div>
                                            {r.error && <div className="text-red-400">Error: {r.error}</div>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
