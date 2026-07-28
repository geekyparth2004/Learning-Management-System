"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Database, Loader2, Play, CheckCircle2, XCircle } from "lucide-react";
import CodeEditor from "@/components/CodeEditor";

interface SQLTestCase {
    setupSql: string;
    expectedOutput: string;
    isHidden: boolean;
}

interface SQLQuestion {
    title: string;
    description: string;
    testCases: SQLTestCase[];
}

export interface SQLRoundResult {
    score: number;
    maxScore: number;
    solved: number;
    total: number;
    passedTestCases: number;
    totalTestCases: number;
    questions: {
        title: string;
        passedCount: number;
        testCaseCount: number;
        finalQuery: string;
        testResults: { expected: string; actual: string; passed: boolean; isHidden: boolean; error?: string }[];
    }[];
}

interface SQLPlayerProps {
    level: number;
    questionCount: number;
    onComplete: (result: SQLRoundResult) => void;
}

// Results are compared on normalized text: CRLF -> LF, trailing whitespace stripped,
// so formatting quirks don't fail a correct query.
function normalizeOutput(text: string): string {
    return (text || "")
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map(line => line.replace(/\s+$/, ""))
        .join("\n")
        .trim();
}

export default function SQLPlayer({ level, questionCount, onComplete }: SQLPlayerProps) {
    const [questions, setQuestions] = useState<SQLQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [activeIndex, setActiveIndex] = useState(0);
    const [queryMap, setQueryMap] = useState<Record<number, string>>({});
    const [resultMap, setResultMap] = useState<Record<number, { passed: boolean; results: any[] }>>({});
    const [isRunning, setIsRunning] = useState(false);
    const [showTestResults, setShowTestResults] = useState(false);

    useEffect(() => {
        let cancelled = false;
        async function loadQuestions() {
            try {
                const res = await fetch("/api/assessment/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: "sql", level, questionCount }),
                });
                const data = await res.json();
                if (cancelled) return;
                if (data.error) {
                    setError(data.error);
                } else {
                    const items: SQLQuestion[] = data.questions || [];
                    setQuestions(items);
                    const initial: Record<number, string> = {};
                    items.forEach((_, idx) => { initial[idx] = "-- Write your SQL query here\n"; });
                    setQueryMap(initial);
                }
            } catch (err: any) {
                if (!cancelled) setError(err.message || "Failed to load SQL questions");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        loadQuestions();
        return () => { cancelled = true; };
    }, [level, questionCount]);

    const currentQuery = queryMap[activeIndex] || "";

    const handleQueryChange = useCallback((val: string | undefined) => {
        if (val === undefined) return;
        setQueryMap(prev => ({ ...prev, [activeIndex]: val }));
    }, [activeIndex]);

    async function runQuery() {
        const question = questions[activeIndex];
        if (!question) return;

        setIsRunning(true);
        setShowTestResults(true);

        const testResults: any[] = [];
        let allPassed = true;

        for (const tc of question.testCases) {
            try {
                const res = await fetch("/api/assessment/sql-execute", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ setupSql: tc.setupSql, query: currentQuery }),
                });
                const data = await res.json();
                if (data.error) {
                    allPassed = false;
                    testResults.push({
                        expected: tc.expectedOutput,
                        actual: "",
                        passed: false,
                        isHidden: tc.isHidden,
                        error: data.error,
                    });
                    continue;
                }
                const passed = normalizeOutput(data.output) === normalizeOutput(tc.expectedOutput);
                if (!passed) allPassed = false;
                testResults.push({
                    expected: tc.expectedOutput,
                    actual: data.output || "",
                    passed,
                    isHidden: tc.isHidden,
                });
            } catch (err: any) {
                allPassed = false;
                testResults.push({
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

    function finishSQL() {
        // +3 marks per passed test case, judged from each question's latest run
        let passedTestCases = 0;
        let totalTestCases = 0;
        const questionResults = questions.map((q, idx) => {
            const run = resultMap[idx];
            const testResults = run?.results || [];
            const passedCount = testResults.filter((r: any) => r.passed).length;
            passedTestCases += passedCount;
            totalTestCases += q.testCases.length;
            return {
                title: q.title,
                passedCount,
                testCaseCount: q.testCases.length,
                finalQuery: queryMap[idx] || "",
                testResults,
            };
        });
        const solved = questions.filter((_, idx) => resultMap[idx]?.passed).length;
        onComplete({
            score: passedTestCases * 3,
            maxScore: totalTestCases * 3,
            solved,
            total: questions.length,
            passedTestCases,
            totalTestCases,
            questions: questionResults,
        });
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-violet-400" />
                <p className="text-gray-400">AI is generating {questionCount} SQL questions at Level {level}...</p>
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

    if (questions.length === 0) {
        return (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
                <p className="text-gray-400">No SQL questions generated.</p>
            </div>
        );
    }

    const activeQuestion = questions[activeIndex];

    return (
        <div className="flex flex-col h-[calc(100vh-3.5rem)]">
            {/* Question tabs */}
            <div className="flex items-center gap-2 border-b border-gray-800 px-4 py-2 overflow-x-auto">
                {questions.map((q, idx) => {
                    const result = resultMap[idx];
                    return (
                        <button key={idx} onClick={() => { setActiveIndex(idx); setShowTestResults(false); }}
                            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                                idx === activeIndex
                                    ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                            }`}
                        >
                            {result?.passed ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> :
                             result ? <XCircle className="h-3.5 w-3.5 text-red-400" /> :
                             <Database className="h-3.5 w-3.5" />}
                            Question {idx + 1}
                        </button>
                    );
                })}

                <div className="ml-auto flex items-center gap-2">
                    <button onClick={finishSQL}
                        className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-green-500"
                    >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Finish SQL Round
                    </button>
                </div>
            </div>

            {/* Split view */}
            <div className="flex flex-1 min-h-0">
                {/* Left: question + schema */}
                <div className="w-1/2 border-r border-gray-800 overflow-y-auto p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-violet-400" />
                        <h2 className="text-xl font-bold text-white">{activeQuestion.title}</h2>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-300 whitespace-pre-wrap">
                        {activeQuestion.description}
                    </div>

                    {/* Visible test cases */}
                    <div className="space-y-2">
                        <h3 className="font-bold text-gray-300 text-sm">Sample Test Cases</h3>
                        {activeQuestion.testCases.filter(tc => !tc.isHidden).map((tc, idx) => (
                            <div key={idx} className="rounded-lg border border-gray-800 bg-[#111111] p-3 space-y-2 text-xs">
                                <div>
                                    <p className="text-gray-500 mb-1">Data:</p>
                                    <pre className="overflow-x-auto font-mono text-blue-300 whitespace-pre-wrap">{tc.setupSql}</pre>
                                </div>
                                <div>
                                    <p className="text-gray-500 mb-1">Expected result:</p>
                                    <pre className="overflow-x-auto font-mono text-green-300 whitespace-pre">{tc.expectedOutput || "(no rows)"}</pre>
                                </div>
                            </div>
                        ))}
                        <p className="text-xs text-gray-500">
                            +3 marks per passed test case, including hidden ones. Run your query to test it.
                        </p>
                    </div>
                </div>

                {/* Right: SQL editor */}
                <div className="w-1/2 flex flex-col">
                    <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
                        <span className="rounded-lg border border-gray-800 bg-[#111111] px-3 py-1.5 text-sm text-gray-300">
                            SQLite
                        </span>
                        <button onClick={runQuery} disabled={isRunning}
                            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-green-500 disabled:opacity-50"
                        >
                            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                            {isRunning ? "Running..." : "Run & Test"}
                        </button>
                    </div>

                    {/* Editor */}
                    <div className="flex-1 min-h-0">
                        <CodeEditor
                            language="sql"
                            code={currentQuery}
                            onChange={handleQueryChange}
                        />
                    </div>

                    {/* Test results */}
                    {showTestResults && resultMap[activeIndex] && (
                        <div className="border-t border-gray-800 max-h-[220px] overflow-y-auto p-3 space-y-2">
                            <h4 className="text-sm font-bold text-gray-300">Test Results</h4>
                            {resultMap[activeIndex].results.map((r, idx) => (
                                <div key={idx} className={`rounded-lg border p-2 text-xs ${
                                    r.passed ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
                                }`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        {r.passed ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> : <XCircle className="h-3.5 w-3.5 text-red-400" />}
                                        <span className={r.passed ? "text-green-400" : "text-red-400"}>
                                            {r.isHidden ? "Hidden " : ""}Test Case {idx + 1}: {r.passed ? "Passed (+3)" : "Failed"}
                                        </span>
                                    </div>
                                    {!r.isHidden && !r.passed && (
                                        <div className="ml-5 space-y-0.5 text-gray-400">
                                            <div>Expected: <pre className="inline font-mono text-green-300 whitespace-pre-wrap">{r.expected || "(no rows)"}</pre></div>
                                            <div>Got: <pre className="inline font-mono text-red-300 whitespace-pre-wrap">{r.actual || "(empty)"}</pre></div>
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
