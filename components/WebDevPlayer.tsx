"use client";

import React, { useState, useEffect, useRef } from "react";
import { CheckCircle, RefreshCw, Layout, ArrowLeft, Clock } from "lucide-react";

import WebDevEditor from "./WebDevEditor";

interface WebDevPlayerProps {
    instructions: string;
    initialCode: {
        html: string;
        css: string;
        js: string;
    };
    savedSubmission?: {
        html: string;
        css: string;
        js: string;
    };
    videoSolution?: string;
    onComplete: (submission: any) => void;
    onBack?: () => void;
}

export default function WebDevPlayer({ instructions, initialCode, savedSubmission, videoSolution, onComplete, onBack }: WebDevPlayerProps) {
    const [files, setFiles] = useState<{ name: string; language: string; content: string }[]>([
        { name: "index.html", language: "html", content: savedSubmission?.html || initialCode?.html || "" },
        { name: "styles.css", language: "css", content: savedSubmission?.css || initialCode?.css || "" },
        { name: "script.js", language: "javascript", content: savedSubmission?.js || initialCode?.js || "" }
    ]);
    const [activeFileName, setActiveFileName] = useState("index.html");
    const [leftPanelTab, setLeftPanelTab] = useState<"problem" | "preview">("problem");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [duration, setDuration] = useState(0);

    // Timer
    useEffect(() => {
        const timer = setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // Split View State
    const [splitRatio, setSplitRatio] = useState(40);
    // ... rest of state ...

    // ... existing resize logic ...

    // ... existing useEffect ...

    // ... existing srcDoc ...

    // ... existing handleAddFile ...

    // ... existing updateFileContent ...

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Map back to expected format for backward compatibility
            const submission = {
                html: files.find(f => f.name === "index.html")?.content || "",
                css: files.find(f => f.name === "styles.css")?.content || "",
                js: files.find(f => f.name === "script.js")?.content || "",
                duration // Pass duration
            };
            await onComplete(submission);
        } catch (error) {
            console.error(error);
            alert("Failed to submit");
        } finally {
            setIsSubmitting(false);
        }
    };

    const activeFile = files.find(f => f.name === activeFileName);

    return (
        <div className="flex h-full flex-col bg-[#0e0e0e] text-white overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-800 bg-[#161616] px-4 py-2">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button onClick={onBack} className="text-gray-400 hover:text-white">
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div className="flex items-center gap-2">
                        <Layout className="text-blue-400" size={20} />
                        <span className="font-bold">Development Assignment</span>
                    </div>

                    {/* Timer */}
                    <div className="flex items-center gap-2 rounded bg-gray-800 px-3 py-1 text-sm font-medium text-blue-400 border border-gray-700">
                        <Clock size={14} />
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 rounded bg-green-600 px-4 py-1.5 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                    {isSubmitting ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                    Submit Assignment
                </button>
            </div>

            {/* Main Content */}
            <WebDevEditor
                files={files}
                setFiles={setFiles}
                instructions={instructions}
                activeFileName={activeFileName}
                setActiveFileName={setActiveFileName}
                videoSolution={videoSolution}
            />
        </div>
    );
}
