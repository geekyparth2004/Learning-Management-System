"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Save, CheckCircle, RefreshCw, Layout, Code, Eye, ArrowLeft } from "lucide-react";
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
