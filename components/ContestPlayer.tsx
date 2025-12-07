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
    const activeProblem = problems[activeProblemIndex];
    const [language, setLanguage] = useState<Language>("java"); // Default java

    const [userCodes, setUserCodes] = useState<{ [key: string]: string | any[] }>({});
    const [activeFileName, setActiveFileName] = useState("index.html");

    const [results, setResults] = useState<{ [key: string]: boolean }>({}); // Local tracking of passed
    const [activeTab, setActiveTab] = useState<"editor" | "console" | "results">("editor");

    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState("");
    const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");

    // Initialize Code
    useEffect(() => {
        const codes: any = {};
        problems.forEach(p => {
            try {
                if (p.defaultCode && p.defaultCode.includes("html")) {
                    codes[p.id] = [];
                } else {
                    codes[p.id] = p.defaultCode ? JSON.parse(p.defaultCode)?.[language] || "" : "";
                }
            } catch (e) {
                console.error("Failed to parse default code", e);
                codes[p.id] = "";
            }
        });
        // We initialize userCodes. Note: we might overwrite if we set it dependent on other things, 
        // but this effect runs once on mount.
        // Better: check if empty.
        setUserCodes(prev => {
            const next = { ...prev };
            problems.forEach(p => {
                if (!next[p.id]) next[p.id] = codes[p.id];
            });
            return next;
        });
    }, [problems, language]); // added deps

    useEffect(() => {
        // Set initial code for current problem if empty
        if (!activeProblem) return;
        if (!userCodes[activeProblem.id] && activeProblem.type !== "WEB_DEV") {
            let defaults = { python: "", java: "", cpp: "" };
            try { defaults = JSON.parse(activeProblem.defaultCode); } catch (e) { }
            setUserCodes(prev => ({ ...prev, [activeProblem.id]: defaults[language as keyof typeof defaults] || "" }));
        }
    }, [activeProblem, language, userCodes]);

    // ... (logic)

    if (!activeProblem) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0e0e0e] text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">No Problems Found</h1>
                    <p className="text-gray-400 mb-6">This contest has no problems yet.</p>
                    <button onClick={onLeave} className="text-red-400 hover:text-red-300">
                        Leave Contest
                    </button>
                </div>
            </div>
        );
    }

    // ...

    <div className="flex-1 relative">
        {activeTab === "editor" && (
            <CodeEditor
                language={language}
                code={userCodes[activeProblem.id] as string || ""}
                onChange={(val) => setUserCodes(prev => ({ ...prev, [activeProblem.id]: val || "" }))}
            />
        )}
        {activeTab === "results" && (
            <div className="p-4 font-mono text-sm text-gray-300 whitespace-pre-wrap">
                {status === "idle" ? "Run your code to see results." : output}
            </div>
        )}
    </div>
}
