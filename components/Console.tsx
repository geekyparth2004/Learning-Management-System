"use client";

import React, { useState } from "react";
import { Terminal, Play, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConsoleProps {
    output: string;
    error?: string;
    status: "idle" | "running" | "success" | "error";
    onInput?: (input: string) => void;
}

export default function Console({ output, error, status, onInput }: ConsoleProps) {
    const [input, setInput] = useState("");

    return (
        <div className="flex h-full flex-col rounded-md border border-gray-700 bg-[#1e1e1e] text-gray-300">
            <div className="flex items-center justify-between border-b border-gray-700 px-4 py-2">
                <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    <span className="text-sm font-medium">Console</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    {status === "running" && <span className="text-yellow-400">Running...</span>}
                    {status === "success" && <span className="text-green-400">Success</span>}
                    {status === "error" && <span className="text-red-400">Error</span>}
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4 font-mono text-sm">
                {output && (
                    <div className="mb-4 whitespace-pre-wrap text-white">
                        <span className="text-gray-500">$ Output:</span>
                        <br />
                        {output}
                    </div>
                )}
                {error && (
                    <div className="mb-4 whitespace-pre-wrap text-red-400">
                        <span className="text-red-500">$ Error:</span>
                        <br />
                        {error}
                    </div>
                )}
                {status === "idle" && !output && !error && (
                    <div className="text-gray-500">Run your code to see output here...</div>
                )}
            </div>

            <div className="border-t border-gray-700 p-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Input:</span>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            onInput?.(e.target.value);
                        }}
                        className="flex-1 bg-transparent text-sm text-white focus:outline-none"
                        placeholder="Type input here..."
                    />
                </div>
            </div>
        </div>
    );
}
