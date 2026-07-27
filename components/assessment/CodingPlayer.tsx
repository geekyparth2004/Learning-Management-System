"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Code, Loader2, Play, CheckCircle2, XCircle, ChevronRight, ChevronDown } from "lucide-react";
import CodeEditor from "@/components/CodeEditor";

interface TestCase {
    input: string;
    expectedOutput: string;
    isHidden: boolean;
}

interface CodingProblem {
    title: string;
    description: string;
    defaultCode: Record<string, string>;
    testCases: TestCase[];
}

export interface CodingRoundResult {
    score: number;
    maxScore: number;
    solved: number;
    total: number;
    passedTestCases: number;
    totalTestCases: number;
    problems: {
        title: string;
        passedCount: number;
        testCaseCount: number;
        testResults: { input: string; expected: string; actual: string; passed: boolean; isHidden: boolean; error?: string }[];
    }[];
}

interface CodingPlayerProps {
    level: number;
    problemCount: number;
    onComplete: (results: CodingRoundResult) => void;
}

export default function CodingPlayer({ level, problemCount, onComplete }: CodingPlayerProps) {
    const [problems, setProblems] = useState<CodingProblem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [activeProblemIndex, setActiveProblemIndex] = useState(0);
    const [language, setLanguage] = useState<"python" | "java" | "cpp">("python");

    // Code state per problem
    const [codeMap, setCodeMap] = useState<Record<string, string>>({});
    // Results per problem
    const [resultMap, setResultMap] = useState<Record<number, { passed: boolean; results: any[] }>>({});
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState<string>("");
    const [showTestResults, setShowTestResults] = useState(false);

    // Load problems
    useEffect(() => {
        async function loadProblems() {
            try {
                const res = await fetch("/api/assessment/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: "coding", level, problemCount }),
                });
                const data = await res.json();
                if (data.error) {
                    setError(data.error);
                } else {
                    const probs = data.problems || [];
                    setProblems(probs);
                    // Initialize code map
                    const initial: Record<string, string> = {};
                    probs.forEach((p: CodingProblem, idx: number) => {
                        initial[`${idx}_python`] = p.defaultCode?.python || "# Your code here\n";
                        initial[`${idx}_java`] = p.defaultCode?.java || "// Your code here\n";
                        initial[`${idx}_cpp`] = p.defaultCode?.cpp || "// Your code here\n";
                    });
                    setCodeMap(initial);
                }
            } catch (err: any) {
                setError(err.message || "Failed to load problems");
            } finally {
                setLoading(false);
            }
        }
        loadProblems();
    }, [level, problemCount]);

    const currentCode = codeMap[`${activeProblemIndex}_${language}`] || "";

    const handleCodeChange = useCallback((val: string | undefined) => {
        if (val === undefined) return;
        setCodeMap(prev => ({
            ...prev,
            [`${activeProblemIndex}_${language}`]: val,
        }));
    }, [activeProblemIndex, language]);

    async function runCode() {
        const problem = problems[activeProblemIndex];
        if (!problem) return;

        setIsRunning(true);
        setOutput("");
        setShowTestResults(true);

        const testResults: any[] = [];
        let allPassed = true;

        for (const tc of problem.testCases) {
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
            [activeProblemIndex]: { passed: allPassed, results: testResults },
        }));
        setIsRunning(false);
    }

    function finishCoding() {
        // +5 marks per passed test case, judged from each problem's latest run
        const solved = Object.values(resultMap).filter(r => r.passed).length;
        let passedTestCases = 0;
        let totalTestCases = 0;
        const problemResults = problems.map((p, idx) => {
            const run = resultMap[idx];
            const testResults = run?.results || [];
            const passedCount = testResults.filter((r: any) => r.passed).length;
            passedTestCases += passedCount;
            totalTestCases += p.testCases.length;
            return {
                title: p.title,
                passedCount,
                testCaseCount: p.testCases.length,
                testResults,
            };
        });
        onComplete({
            score: passedTestCases * 5,
            maxScore: totalTestCases * 5,
            solved,
            total: problems.length,
            passedTestCases,
            totalTestCases,
            problems: problemResults,
        });
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
                <p className="text-gray-400">AI is generating {problemCount} coding problems at Level {level}...</p>
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

    if (problems.length === 0) {
        return (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
                <p className="text-gray-400">No problems generated.</p>
            </div>
        );
    }

    const activeProblem = problems[activeProblemIndex];

    return (
        <div className="flex flex-col h-[calc(100vh-3.5rem)]">
            {/* Problem tabs */}
            <div className="flex items-center gap-2 border-b border-gray-800 px-4 py-2 overflow-x-auto">
                {problems.map((p, idx) => {
                    const result = resultMap[idx];
                    return (
                        <button key={idx} onClick={() => { setActiveProblemIndex(idx); setShowTestResults(false); }}
                            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                                idx === activeProblemIndex
                                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                            }`}
                        >
                            {result?.passed ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> :
                             result ? <XCircle className="h-3.5 w-3.5 text-red-400" /> :
                             <Code className="h-3.5 w-3.5" />}
                            Problem {idx + 1}
                        </button>
                    );
                })}

                <div className="ml-auto flex items-center gap-2">
                    <button onClick={finishCoding}
                        className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-green-500"
                    >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Finish Coding Round
                    </button>
                </div>
            </div>

            {/* Split view */}
            <div className="flex flex-1 min-h-0">
                {/* Left: problem description */}
                <div className="w-1/2 border-r border-gray-800 overflow-y-auto p-6 space-y-4">
                    <h2 className="text-xl font-bold text-white">{activeProblem.title}</h2>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-300 whitespace-pre-wrap">
                        {activeProblem.description}
                    </div>

                    {/* Visible test cases */}
                    <div className="space-y-2">
                        <h3 className="font-bold text-gray-300 text-sm">Sample Test Cases</h3>
                        {activeProblem.testCases.filter(tc => !tc.isHidden).map((tc, idx) => (
                            <div key={idx} className="rounded-lg border border-gray-800 bg-[#111111] p-3 space-y-1 text-sm">
                                <div><span className="text-gray-500">Input:</span> <code className="text-blue-300">{tc.input}</code></div>
                                <div><span className="text-gray-500">Output:</span> <code className="text-green-300">{tc.expectedOutput}</code></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: code editor */}
                <div className="w-1/2 flex flex-col">
                    {/* Language select + Run */}
                    <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
                        <select value={language} onChange={(e) => setLanguage(e.target.value as any)}
                            className="rounded-lg border border-gray-800 bg-[#111111] px-3 py-1.5 text-sm text-white focus:outline-none"
                        >
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="cpp">C++</option>
                        </select>
                        <button onClick={runCode} disabled={isRunning}
                            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-green-500 disabled:opacity-50"
                        >
                            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                            {isRunning ? "Running..." : "Run & Test"}
                        </button>
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
                    {showTestResults && resultMap[activeProblemIndex] && (
                        <div className="border-t border-gray-800 max-h-[200px] overflow-y-auto p-3 space-y-2">
                            <h4 className="text-sm font-bold text-gray-300">Test Results</h4>
                            {resultMap[activeProblemIndex].results.map((r, idx) => (
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
