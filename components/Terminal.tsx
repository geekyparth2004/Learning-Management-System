"use client";

import React, { useEffect, useRef, useState } from "react";
import { Terminal as TerminalIcon } from "lucide-react";

interface TerminalProps {
    output: string;
    error?: string;
    status: "idle" | "running" | "success" | "error";
    stdin: string;
    onStdinChange: (value: string) => void;
}

export default function Terminal({ output, error, status, stdin, onStdinChange }: TerminalProps) {
    const [activeTab, setActiveTab] = useState<"output" | "input">("output");
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when output changes
    useEffect(() => {
        if (activeTab === "output" && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [output, error, status, activeTab]);

    // Switch to output tab when running
    useEffect(() => {
        if (status === "running") {
            setActiveTab("output");
        }
    }, [status]);

    return (
        <div className="flex h-full flex-col rounded-b-lg bg-[#1e1e1e] font-mono text-sm text-gray-300">
            {/* Header / Tabs */}
            <div className="flex items-center border-b border-gray-800 bg-[#161616]">
                <button
                    onClick={() => setActiveTab("output")}
                    className={`flex items-center gap-2 border-r border-gray-800 px-4 py-2 text-xs font-medium uppercase tracking-wider hover:bg-[#1e1e1e] hover:text-white ${activeTab === "output" ? "bg-[#1e1e1e] text-blue-400" : "text-gray-500"
                        }`}
                >
                    <TerminalIcon className="h-3 w-3" />
                    <span>Output</span>
                </button>
                <button
                    onClick={() => setActiveTab("input")}
                    className={`flex items-center gap-2 border-r border-gray-800 px-4 py-2 text-xs font-medium uppercase tracking-wider hover:bg-[#1e1e1e] hover:text-white ${activeTab === "input" ? "bg-[#1e1e1e] text-blue-400" : "text-gray-500"
                        }`}
                >
                    <span>Input</span>
                    {stdin && <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                </button>

                <div className="ml-auto mr-4 flex items-center gap-2 text-xs">
                    {status === "running" && <span className="animate-pulse text-yellow-500">Executing...</span>}
                    {status === "success" && <span className="text-green-500">Done</span>}
                    {status === "error" && <span className="text-red-500">Error</span>}
                </div>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 overflow-hidden">
                {activeTab === "output" ? (
                    <div
                        ref={scrollRef}
                        className="h-full overflow-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700"
                    >
                        {/* Output Display */}
                        <div className="whitespace-pre-wrap leading-relaxed">
                            {output && <span className="text-white">{output}</span>}
                            {error && <span className="text-red-400 block mt-2">{error}</span>}
                            {!output && !error && status !== "running" && (
                                <span className="text-gray-600 italic">Click "Run Code" to see output...</span>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="h-full p-2">
                        <textarea
                            value={stdin}
                            onChange={(e) => onStdinChange(e.target.value)}
                            className="h-full w-full resize-none rounded border border-gray-800 bg-[#111111] p-3 text-white focus:border-blue-500 focus:outline-none"
                            placeholder="Enter input here (STDIN)..."
                            spellCheck={false}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
