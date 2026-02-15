"use client";

import React, { useState, useEffect, useRef } from "react";
import { Layout, Code, Eye, RefreshCw, CheckCircle, ArrowLeft } from "lucide-react";
import CodeEditor from "@/components/CodeEditor";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

interface File {
    name: string;
    language: string;
    content: string;
}

interface WebDevEditorProps {
    files: File[];
    setFiles: (files: File[]) => void;
    instructions: string;
    activeFileName: string;
    setActiveFileName: (name: string) => void;
    videoSolution?: string;
}

export default function WebDevEditor({ files, setFiles, instructions, activeFileName, setActiveFileName, videoSolution }: WebDevEditorProps) {
    const [leftPanelTab, setLeftPanelTab] = useState<"problem" | "preview" | "solution">("problem");
    const [splitRatio, setSplitRatio] = useState(40);
    const [isResizing, setIsResizing] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);
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
                
                // Auto-scroll logic
                window.onload = function() {
                    if (${autoScroll}) {
                        window.scrollTo(0, document.body.scrollHeight);
                        // Also try scrolling documentElement for some browsers
                        document.documentElement.scrollTop = document.documentElement.scrollHeight;
                    }
                };
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

    const activeFile = files.find(f => f.name === activeFileName);

    return (
        <div className="flex flex-1 overflow-hidden h-full" ref={containerRef}>
            {/* Left Panel */}
            <div className="flex flex-col border-r border-gray-800 bg-[#111111]" style={{ width: `${splitRatio}%` }}>
                <div className="flex shrink-0 border-b border-gray-800 justify-between items-center pr-2">
                    <div className="flex flex-1">
                        <button
                            onClick={() => setLeftPanelTab("problem")}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${leftPanelTab === "problem" ? "bg-[#1e1e1e] text-white border-b-2 border-blue-500" : "text-gray-400 hover:text-white"}`}
                        >
                            Problem Statement
                        </button>
                        <button
                            onClick={() => setLeftPanelTab("preview")}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${leftPanelTab === "preview" ? "bg-[#1e1e1e] text-white border-b-2 border-blue-500" : "text-gray-400 hover:text-white"}`}
                        >
                            Live Preview
                        </button>
                        {videoSolution && (
                            <button
                                onClick={() => setLeftPanelTab("solution")}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${leftPanelTab === "solution" ? "bg-[#1e1e1e] text-white border-b-2 border-blue-500" : "text-gray-400 hover:text-white"}`}
                            >
                                Solution
                            </button>
                        )}
                    </div>
                    {leftPanelTab === "preview" && (
                        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={autoScroll}
                                onChange={(e) => setAutoScroll(e.target.checked)}
                                className="rounded border-gray-700 bg-[#1e1e1e]"
                            />
                            Auto Scroll
                        </label>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto">
                    {leftPanelTab === "problem" ? (
                        <div className="p-6 prose prose-invert max-w-none text-sm">
                            <h3 className="text-lg font-bold mb-4">Instructions</h3>
                            <div className="prose prose-invert max-w-none text-sm text-gray-300">
                                <ReactMarkdown
                                    rehypePlugins={[rehypeRaw]}
                                    components={{
                                        img: ({ node, ...props }) => {
                                            let src = typeof props.src === 'string' ? props.src : "";
                                            // Check for raw R2/S3 URL matching our private pattern and rewrite to proxy
                                            if (src.includes("r2.cloudflarestorage.com") && !src.includes("pub-") && !src.includes("/api/image-proxy")) {
                                                try {
                                                    const url = new URL(src);
                                                    const pathParts = url.pathname.split('/');
                                                    if (pathParts.length >= 3) {
                                                        const key = pathParts.slice(2).join('/');
                                                        src = `/api/image-proxy?key=${encodeURIComponent(key)}`;
                                                    }
                                                } catch (e) { }
                                            }

                                            return (
                                                <img
                                                    {...props}
                                                    src={src}
                                                    className="max-w-full rounded-lg border border-gray-800 my-4"
                                                    style={{ display: 'block', maxHeight: '400px' }}
                                                />
                                            );
                                        }
                                    }}
                                >
                                    {instructions}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ) : leftPanelTab === "preview" ? (
                        <div className="h-full w-full bg-white">
                            <iframe
                                srcDoc={srcDoc}
                                title="preview"
                                sandbox="allow-scripts"
                                className="h-full w-full border-0"
                            />
                        </div>
                    ) : (
                        <div className="p-6">
                            <h3 className="text-lg font-bold mb-4">Solution Video</h3>
                            <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                                {videoSolution?.includes("cloudinary.com") || videoSolution?.includes("r2.cloudflarestorage.com") || videoSolution?.endsWith(".mp4") ? (
                                    <video
                                        src={videoSolution}
                                        controls
                                        className="h-full w-full object-contain"
                                    />
                                ) : (
                                    <iframe
                                        src={videoSolution?.replace("watch?v=", "embed/")}
                                        className="h-full w-full"
                                        allowFullScreen
                                    />
                                )}
                            </div>
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
                <div className="flex shrink-0 items-center justify-between border-b border-gray-800 bg-[#161616] overflow-x-auto">
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

                <div className="flex-1 relative overflow-hidden">
                    {activeFile && (
                        <CodeEditor
                            key={activeFile.name} // Force re-mount on file change to ensure correct language/content
                            language={activeFile.language as any}
                            code={activeFile.content}
                            onChange={(value) => updateFileContent(value || "")}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
