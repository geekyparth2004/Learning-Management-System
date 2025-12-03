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
    const [files, setFiles] = useState<{ name: string; language: string; content: string }[]>([
        { name: "index.html", language: "html", content: savedSubmission?.html || initialCode?.html || "" },
        { name: "styles.css", language: "css", content: savedSubmission?.css || initialCode?.css || "" },
        { name: "script.js", language: "javascript", content: savedSubmission?.js || initialCode?.js || "" }
    ]);
    const [activeFileName, setActiveFileName] = useState("index.html");
    const [leftPanelTab, setLeftPanelTab] = useState<"problem" | "preview">("problem");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Split View State
    const [splitRatio, setSplitRatio] = useState(40);
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
            <style>
                html, body { height: 100%; margin: 0; }
                ${files.filter(f => f.language === "css").map(f => f.content).join("\n")}
            </style>
        </head>
        <body>
            ${files.find(f => f.name === "index.html")?.content || ""}
            <script>
                ${files.filter(f => f.language === "javascript").map(f => f.content).join("\n")}
            </script>
        </body>
        </html>
    `;

    const handleAddFile = () => {
        const fileName = window.prompt("Enter file name (e.g., about.html, style2.css):");
        if (!fileName) return;

        if (files.some(f => f.name === fileName)) {
            alert("File already exists!");
            return;
        }

        let language = "plaintext";
        if (fileName.endsWith(".html")) language = "html";
        else if (fileName.endsWith(".css")) language = "css";
        else if (fileName.endsWith(".js")) language = "javascript";

        setFiles([...files, { name: fileName, language, content: "" }]);
        setActiveFileName(fileName);
    };

    const updateFileContent = (value: string) => {
        setFiles(files.map(f => f.name === activeFileName ? { ...f, content: value } : f));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Map back to expected format for backward compatibility
            const submission = {
                html: files.find(f => f.name === "index.html")?.content || "",
                css: files.find(f => f.name === "styles.css")?.content || "",
                js: files.find(f => f.name === "script.js")?.content || ""
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
                    <div className="flex items-center justify-between border-b border-gray-800 bg-[#161616] overflow-x-auto">
                        <div className="flex">
                            {files.map(file => (
                                <button
                                    key={file.name}
                                    onClick={() => setActiveFileName(file.name)}
                                    className={`px-6 py-2 text-sm font-medium transition-colors border-r border-gray-800 whitespace-nowrap ${activeFileName === file.name ? "bg-[#1e1e1e] text-blue-400 border-t-2 border-t-blue-400" : "bg-[#111111] text-gray-400 hover:text-white"}`}
                                >
                                    {file.name}
                                </button>
                            ))}
                            <button
                                onClick={handleAddFile}
                                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-[#1e1e1e] transition-colors"
                                title="Add File"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 relative">
                        {activeFile && (
                            <Editor
                                key={activeFile.name} // Force re-mount on file change to ensure correct language/content
                                height="100%"
                                language={activeFile.language}
                                value={activeFile.content}
                                onChange={(value) => updateFileContent(value || "")}
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
