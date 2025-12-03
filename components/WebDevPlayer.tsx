"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Save, CheckCircle, RefreshCw, Layout, Code, Eye, ArrowLeft } from "lucide-react";
import Editor from "@monaco-editor/react";

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
    onComplete: (submission: any) => void;
    onBack?: () => void;
}

export default function WebDevPlayer({ instructions, initialCode, savedSubmission, onComplete, onBack }: WebDevPlayerProps) {
    const [html, setHtml] = useState(savedSubmission?.html || initialCode?.html || "");
    const [css, setCss] = useState(savedSubmission?.css || initialCode?.css || "");
    const [js, setJs] = useState(savedSubmission?.js || initialCode?.js || "");
    const [activeTab, setActiveTab] = useState<"html" | "css" | "js">("html");
    const [leftPanelTab, setLeftPanelTab] = useState<"problem" | "preview">("problem");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Split View State
    const [splitRatio, setSplitRatio] = useState(40); // 40% left, 60% right
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const startResizing = () => setIsResizing(true);
    const stopResizing = () => setIsResizing(false);

    const resize = (e: MouseEvent) => {
        if (isResizing && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const newRatio = ((e.clientX - containerRect.left) / containerRect.width) * 100;
            if (newRatio > 20 && newRatio < 80) {
                setSplitRatio(newRatio);
            }
        }
    };

    useEffect(() => {
        if (isResizing) {
            window.addEventListener("mousemove", resize);
            window.addEventListener("mouseup", stopResizing);
        } else {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        }
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [isResizing]);

    const srcDoc = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>${css}</style>
        </head>
        <body>
            ${html}
            <script>${js}</script>
        </body>
        </html>
    `;

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await onComplete({ html, css, js });
        } catch (error) {
            console.error(error);
            alert("Failed to submit");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex h-full flex-col bg-[#0e0e0e] text-white overflow-hidden" ref={containerRef}>
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
            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel */}
                <div className="flex flex-col border-r border-gray-800 bg-[#111111]" style={{ width: `${splitRatio}%` }}>
                    <div className="flex border-b border-gray-800">
                        <button
                            onClick={() => setLeftPanelTab("problem")}
                            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${leftPanelTab === "problem" ? "bg-[#1e1e1e] text-white border-b-2 border-blue-500" : "text-gray-400 hover:text-white"}`}
                        >
                            Problem Statement
                        </button>
                        <button
                            onClick={() => setLeftPanelTab("preview")}
                            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${leftPanelTab === "preview" ? "bg-[#1e1e1e] text-white border-b-2 border-blue-500" : "text-gray-400 hover:text-white"}`}
                        >
                            Live Preview
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {leftPanelTab === "problem" ? (
                            <div className="p-6 prose prose-invert max-w-none text-sm">
                                <h3 className="text-lg font-bold mb-4">Instructions</h3>
                                <div className="whitespace-pre-wrap text-gray-300">{instructions}</div>
                            </div>
                        ) : (
                            <div className="h-full w-full bg-white">
                                <iframe
                                    srcDoc={srcDoc}
                                    title="preview"
                                    sandbox="allow-scripts"
                                    className="h-full w-full border-0"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Resizer */}
                <div
                    className="w-1 cursor-col-resize bg-gray-800 hover:bg-blue-500 transition-colors"
                    onMouseDown={startResizing}
                />

                {/* Right Panel (Editors) */}
                <div className="flex flex-col bg-[#1e1e1e]" style={{ width: `calc(${100 - splitRatio}% - 4px)` }}>
                    <div className="flex items-center justify-between border-b border-gray-800 bg-[#161616]">
                        <div className="flex">
                            <button
                                onClick={() => setActiveTab("html")}
                                className={`px-6 py-2 text-sm font-medium transition-colors border-r border-gray-800 ${activeTab === "html" ? "bg-[#1e1e1e] text-orange-400 border-t-2 border-t-orange-400" : "bg-[#111111] text-gray-400 hover:text-white"}`}
                            >
                                index.html
                            </button>
                            <button
                                onClick={() => setActiveTab("css")}
                                className={`px-6 py-2 text-sm font-medium transition-colors border-r border-gray-800 ${activeTab === "css" ? "bg-[#1e1e1e] text-blue-400 border-t-2 border-t-blue-400" : "bg-[#111111] text-gray-400 hover:text-white"}`}
                            >
                                styles.css
                            </button>
                            <button
                                onClick={() => setActiveTab("js")}
                                className={`px-6 py-2 text-sm font-medium transition-colors border-r border-gray-800 ${activeTab === "js" ? "bg-[#1e1e1e] text-yellow-400 border-t-2 border-t-yellow-400" : "bg-[#111111] text-gray-400 hover:text-white"}`}
                            >
                                script.js
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 relative">
                        {activeTab === "html" && (
                            <Editor
                                height="100%"
                                defaultLanguage="html"
                                value={html}
                                onChange={(value) => setHtml(value || "")}
                                theme="vs-dark"
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    wordWrap: "on",
                                    automaticLayout: true,
                                    padding: { top: 16 },
                                }}
                            />
                        )}
                        {activeTab === "css" && (
                            <Editor
                                height="100%"
                                defaultLanguage="css"
                                value={css}
                                onChange={(value) => setCss(value || "")}
                                theme="vs-dark"
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    wordWrap: "on",
                                    automaticLayout: true,
                                    padding: { top: 16 },
                                }}
                            />
                        )}
                        {activeTab === "js" && (
                            <Editor
                                height="100%"
                                defaultLanguage="javascript"
                                value={js}
                                onChange={(value) => setJs(value || "")}
                                theme="vs-dark"
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    wordWrap: "on",
                                    automaticLayout: true,
                                    padding: { top: 16 },
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
