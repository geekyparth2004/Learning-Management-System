"use client";

import React, { useState, useRef, useEffect } from "react";
import { Terminal } from "lucide-react";

interface ConsoleProps {
    output: string;
    error?: string;
    status: "idle" | "running" | "success" | "error";
    onInput?: (input: string) => void;
}

export default function Console({ output, error, status, onInput }: ConsoleProps) {
    const [input, setInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when output changes
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [output, error, status]);

    // Focus input when clicking anywhere in the console
    const handleContainerClick = () => {
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            onInput?.(input);
            // Optional: Clear input after sending, or keep it if mimicking a persistent prompt
            // For now, let's keep it to allow editing, or we could clear it if we were appending to a log.
            // Since the parent manages state, we might just want to trigger the callback.
            // If we want to simulate "sending" a command, we might want to clear it here visually
            // but the parent 'customInput' state is what matters for the run button.
            // The user request is "mimic VS Code terminal".
            // In VS Code debug console, you type and hit enter, it evaluates.
            // Here, the input is PRE-SET for the code execution.
            // So it's more like setting stdin before running.
            // But visually, let's make it look like a prompt line.
        }
    };

    return (
        <div
            className="flex h-full flex-col rounded-md border border-gray-700 bg-[#1e1e1e] text-gray-300 font-mono text-sm"
            onClick={handleContainerClick}
        >
            <div className="flex items-center justify-between border-b border-gray-700 px-4 py-2 bg-[#1e1e1e]">
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

            <div className="flex-1 overflow-auto p-4 cursor-text" ref={scrollRef}>
                {/* Output Area */}
                {output && (
                    <div className="whitespace-pre-wrap text-white mb-2">
                        {output}
                    </div>
                )}
                {error && (
                    <div className="whitespace-pre-wrap text-red-400 mb-2">
                        {error}
                    </div>
                )}

                {/* Input Prompt Line */}
                <div className="flex items-center gap-2 text-gray-300">
                    <span className="text-blue-400 font-bold">{">"}</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            onInput?.(e.target.value);
                        }}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-600"
                        placeholder="Type input here..."
                        autoComplete="off"
                    />
                </div>
            </div>
        </div>
    );
}
