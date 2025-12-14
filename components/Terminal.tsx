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
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when output changes
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [output, error, status]);

    return (
        <div className="flex h-full flex-col rounded-b-lg bg-[#1e1e1e] font-mono text-sm text-gray-300">
            {/* Header / Tabs - Visual only since we are just replacing Console */}
            <div className="flex items-center border-b border-gray-800 bg-[#161616] px-4 py-2">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                    <TerminalIcon className="h-3 w-3" />
                    <span>Terminal</span>
                </div>
                <div className="ml-auto flex items-center gap-2 text-xs">
                    {status === "running" && <span className="animate-pulse text-yellow-500">Executing...</span>}
                    {status === "success" && <span className="text-green-500">Done</span>}
                    {status === "error" && <span className="text-red-500">Error</span>}
                </div>
            </div>

            {/* Terminal Body */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700"
                onClick={() => document.getElementById("terminal-input")?.focus()}
            >
                {/* Previous Output / History mimic */}
                <div className="mb-4 whitespace-pre-wrap leading-relaxed">
                    {output && <span className="text-white">{output}</span>}
                    {error && <span className="text-red-400">{error}</span>}
                </div>

                {/* Active Prompt Line */}
                <div className="flex items-center gap-2">
                    <span className="font-bold text-green-500">➜</span>
                    <span className="font-bold text-blue-500">~</span>
                    <input
                        id="terminal-input"
                        type="text"
                        value={stdin}
                        onChange={(e) => onStdinChange(e.target.value)}
                        className="flex-1 border-none bg-transparent p-0 text-white focus:outline-none focus:ring-0"
                        placeholder="Type input here..."
                        autoComplete="off"
                        spellCheck={false}
                    />
                </div>
            </div>
        </div>
    );
}
