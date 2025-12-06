import React, { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TestCase {
    input: string;
    expectedOutput: string;
    isHidden: boolean;
}

interface ProblemData {
    title: string;
    description: string;
    testCases: TestCase[];
    type: "CODING" | "WEB_DEV" | "LEETCODE";
    webDevInstructions?: string;
    webDevInitialCode?: {
        html: string;
        css: string;
        js: string;
    };
    leetcodeUrl?: string;
}

interface ContestProblemBuilderProps {
    onSave: (problem: ProblemData) => void;
    onCancel: () => void;
}

export default function ContestProblemBuilder({ onSave, onCancel }: ContestProblemBuilderProps) {
    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [testCases, setTestCases] = useState<TestCase[]>([{ input: "", expectedOutput: "", isHidden: false }]);
    const [problemType, setProblemType] = useState<"CODING" | "WEB_DEV" | "LEETCODE">("CODING");
    const [webDevInstructions, setWebDevInstructions] = useState("");
    const [webDevHtml, setWebDevHtml] = useState("<!-- Write your HTML here -->");
    const [webDevCss, setWebDevCss] = useState("/* Write your CSS here */");
    const [webDevJs, setWebDevJs] = useState("// Write your JS here");

    const handleAddTestCase = () => {
        setTestCases([...testCases, { input: "", expectedOutput: "", isHidden: false }]);
    };

    const handleRemoveTestCase = (index: number) => {
        setTestCases(testCases.filter((_, i) => i !== index));
    };

    const handleTestCaseChange = (index: number, field: keyof TestCase, value: string) => {
        const newTestCases = [...testCases];
        newTestCases[index] = { ...newTestCases[index], [field]: value };
        setTestCases(newTestCases);
    };

    const handleSave = async () => {
        if (!title) {
            alert("Title is required");
            return;
        }

        if (problemType === "CODING" && !description) {
            alert("Description is required for coding problems");
            return;
        }

        if (problemType === "WEB_DEV" && !webDevInstructions) {
            alert("Instructions are required for web dev problems");
            return;
        }

        onSave({
            title,
            description: problemType === "CODING" ? description : problemType === "WEB_DEV" ? webDevInstructions : "",
            testCases: problemType === "CODING" ? testCases : [],
            type: problemType,
            leetcodeUrl: problemType === "LEETCODE" ? description : undefined, // Using description state for URL
            webDevInstructions: problemType === "WEB_DEV" ? webDevInstructions : undefined,
            webDevInitialCode: problemType === "WEB_DEV" ? {
                html: webDevHtml,
                css: webDevCss,
                js: webDevJs
            } : undefined
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-gray-800 bg-[#0e0e0e] shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-800 bg-[#161616] px-6 py-4">
                    <h2 className="text-xl font-bold text-white">Add Contest Problem</h2>
                    <button onClick={onCancel} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="mb-6 flex items-center gap-4">
                        <label className="text-sm font-medium text-gray-300">Problem Type:</label>
                        <select
                            value={problemType}
                            onChange={(e) => setProblemType(e.target.value as "CODING" | "WEB_DEV" | "LEETCODE")}
                            className="rounded bg-[#111111] border border-gray-700 px-3 py-1 text-sm text-white focus:border-blue-500 focus:outline-none"
                        >
                            <option value="CODING">Coding Problem</option>
                            <option value="WEB_DEV">Web Development</option>
                            <option value="LEETCODE">LeetCode Problem</option>
                        </select>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Problem Title</label>
                            <input
                                type="text"
                                placeholder="e.g., Sum of Two Numbers"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full rounded-lg border border-gray-700 bg-[#1e1e1e] px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        {problemType === "LEETCODE" ? (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">LeetCode URL</label>
                                <input
                                    type="text"
                                    placeholder="https://leetcode.com/problems/two-sum/"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full rounded-lg border border-gray-700 bg-[#1e1e1e] px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                                />
                                <p className="text-xs text-gray-500">
                                    Paste the full URL of the LeetCode problem.
                                </p>
                            </div>
                        ) : problemType === "CODING" ? (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Problem Description</label>
                                    <textarea
                                        placeholder="Describe the problem statement, input format, output format, and constraints..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="h-40 w-full rounded-lg border border-gray-700 bg-[#1e1e1e] px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-white">Test Cases</h3>
                                        <button
                                            onClick={handleAddTestCase}
                                            className="flex items-center gap-2 rounded-lg border border-gray-700 bg-[#1e1e1e] px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
                                        >
                                            <Plus size={16} /> Add Test Case
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {testCases.map((tc, idx) => (
                                            <div key={idx} className="rounded-lg border border-gray-800 bg-[#161616] p-4">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <span className="text-sm font-medium text-gray-400">Test Case {idx + 1}</span>
                                                    {testCases.length > 1 && (
                                                        <button
                                                            onClick={() => handleRemoveTestCase(idx)}
                                                            className="text-gray-500 hover:text-red-400"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="space-y-1">
                                                        <label className="text-xs text-gray-500">Input</label>
                                                        <textarea
                                                            value={tc.input}
                                                            onChange={(e) => handleTestCaseChange(idx, "input", e.target.value)}
                                                            className="h-20 w-full rounded border border-gray-700 bg-[#1e1e1e] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                                                            placeholder="Test case input"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs text-gray-500">Expected Output</label>
                                                        <textarea
                                                            value={tc.expectedOutput}
                                                            onChange={(e) => handleTestCaseChange(idx, "expectedOutput", e.target.value)}
                                                            className="h-20 w-full rounded border border-gray-700 bg-[#1e1e1e] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                                                            placeholder="Expected output"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Instructions</label>
                                    <textarea
                                        placeholder="Enter assignment instructions..."
                                        value={webDevInstructions}
                                        onChange={(e) => setWebDevInstructions(e.target.value)}
                                        className="h-40 w-full rounded-lg border border-gray-700 bg-[#1e1e1e] px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Initial HTML</label>
                                        <textarea
                                            value={webDevHtml}
                                            onChange={(e) => setWebDevHtml(e.target.value)}
                                            className="h-40 w-full rounded-lg border border-gray-700 bg-[#1e1e1e] px-4 py-2 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Initial CSS</label>
                                        <textarea
                                            value={webDevCss}
                                            onChange={(e) => setWebDevCss(e.target.value)}
                                            className="h-40 w-full rounded-lg border border-gray-700 bg-[#1e1e1e] px-4 py-2 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Initial JS</label>
                                        <textarea
                                            value={webDevJs}
                                            onChange={(e) => setWebDevJs(e.target.value)}
                                            className="h-40 w-full rounded-lg border border-gray-700 bg-[#1e1e1e] px-4 py-2 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t border-gray-800 bg-[#161616] px-6 py-4">
                    <button
                        onClick={onCancel}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-700"
                    >
                        Save Problem
                    </button>
                </div>
            </div>
        </div>
    );
}
