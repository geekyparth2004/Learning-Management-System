"use client";

import React from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { emmetHTML, emmetCSS } from "emmet-monaco-es";
import { Language } from "@/types";

interface WebDevCodeEditorProps {
    language: Language;
    code: string;
    onChange: (value: string | undefined) => void;
    readOnly?: boolean;
}

export default function WebDevCodeEditor({
    language,
    code,
    onChange,
    readOnly = false,
}: WebDevCodeEditorProps) {
    const handleEditorDidMount: OnMount = (editor, monaco) => {
        // Enable Emmet for HTML and CSS
        // emmet-monaco-es disposes automatically or returns a dispose function
        // We can register it globally or per editor. The library registers listeners on the editor instance.

        if (language === "html") {
            emmetHTML(monaco, ["html"]);
        } else if (language === "css") {
            emmetCSS(monaco, ["css"]);
        } else if (language === "javascript") {
            // Standard JS completion is usually sufficient, but emmetHTML can be useful for JSX if needed
            // For pure JS, we might not enable emmet, or enable it if user wants HTML snippets in strings
            emmetHTML(monaco, ["javascript"]);
        }
    };

    return (
        <div className="h-full w-full overflow-hidden rounded-md border border-gray-700 bg-[#1e1e1e]">
            <Editor
                height="100%"
                // Map custom types to monaco types if they differ, but html/css/javascript are standard
                language={language}
                value={code}
                theme="vs-dark"
                onChange={onChange}
                onMount={handleEditorDidMount}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 },
                    readOnly: readOnly,
                    // Ensure suggestions are enabled
                    quickSuggestions: true,
                    suggestOnTriggerCharacters: true,
                    wordBasedSuggestions: "currentDocument",
                }}
            />
        </div>
    );
}
