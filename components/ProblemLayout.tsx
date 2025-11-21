import React from "react";

interface ProblemLayoutProps {
    problemDescription: React.ReactNode;
    editor: React.ReactNode;
    console: React.ReactNode;
    toolbar: React.ReactNode;
}

export default function ProblemLayout({
    problemDescription,
    editor,
    console,
    toolbar,
}: ProblemLayoutProps) {
    return (
        <div className="flex h-screen flex-col bg-[#0e0e0e] text-white">
            {/* Header/Toolbar */}
            <header className="border-b border-gray-800 bg-[#161616] px-6 py-3">
                {toolbar}
            </header>

            <main className="flex flex-1 overflow-hidden">
                {/* Left Panel: Problem Description */}
                <div className="w-1/3 min-w-[300px] overflow-y-auto border-r border-gray-800 bg-[#111111] p-6">
                    {problemDescription}
                </div>

                {/* Right Panel: Editor & Console */}
                <div className="flex flex-1 flex-col">
                    {/* Editor Area */}
                    <div className="flex-1 overflow-hidden p-4">
                        {editor}
                    </div>

                    {/* Console Area */}
                    <div className="h-1/3 min-h-[200px] border-t border-gray-800 bg-[#111111] p-4">
                        {console}
                    </div>
                </div>
            </main>
        </div>
    );
}
