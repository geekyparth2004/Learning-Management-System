"use client";

import React, { useState, useEffect } from "react";
import { Clock, CheckCircle, ChevronDown, Trophy } from "lucide-react";
// import CodeEditor from "@/components/CodeEditor";
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
                // alert("Contest Ended!"); // Disable alert for now
                // onLeave();
            } else {
                setTimeLeft(diff);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [endTime]);

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
                // Only set if not present to avoid overwrite
                Object.keys(codes).forEach(key => {
                    if (next[key] === undefined) next[key] = codes[key];
                });
                return next;
            });
        }
    }, [problems, language]); // Only run on problems/language change

    const [activeTab, setActiveTab] = useState<"editor" | "console" | "results">("editor");

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
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-800 bg-[#161616] px-6 py-4">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className="text-xl font-bold">{contest.title}</h1>
                        <p className="text-xs text-gray-400">Problem: {activeProblem?.title}</p>
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
                    <button onClick={onLeave} className="text-sm text-red-400 hover:text-red-300">
                        Leave Contest
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-1 overflow-hidden">
                <div className="w-1/2 flex flex-col border-r border-gray-800 p-6 overflow-y-auto">
                    <h2 className="text-2xl font-bold mb-4">{activeProblem?.title}</h2>
                    <p className="text-gray-300 whitespace-pre-wrap">{activeProblem?.description}</p>
                </div>

                <div className="w-1/2 flex flex-col bg-[#111111]">
                    <div className="flex-1 relative">
                        <textarea
                            className="w-full h-full bg-[#1e1e1e] text-white p-4 font-mono"
                            value={userCodes[activeProblem.id] || ""}
                            onChange={(e) => setUserCodes(prev => ({ ...prev, [activeProblem.id]: e.target.value }))}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
