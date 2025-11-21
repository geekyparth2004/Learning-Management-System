"use client";

import React from "react";
import Editor from "@monaco-editor/react";
import { Language } from "@/types";

interface CodeEditorProps {
    language: Language;
    code: string;
    onChange: (value: string | undefined) => void;
    errorLine?: number | null;
}

export default function CodeEditor({
    language,
    code,
    onChange,
    errorLine,
}: CodeEditorProps) {
    const editorRef = React.useRef<any>(null);
    const monacoRef = React.useRef<any>(null);

    const handleEditorDidMount = (editor: any, monaco: any) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
    };

    React.useEffect(() => {
        if (editorRef.current && monacoRef.current) {
            const model = editorRef.current.getModel();
            if (model) {
                if (errorLine) {
                    monacoRef.current.editor.setModelMarkers(model, "owner", [
                        {
                            startLineNumber: errorLine,
                            startColumn: 1,
                            endLineNumber: errorLine,
                            endColumn: 1000,
                            message: "Error here",
                            severity: monacoRef.current.MarkerSeverity.Error,
                        },
                    ]);
                } else {
                    monacoRef.current.editor.setModelMarkers(model, "owner", []);
                }
            }
        }
    }, [errorLine]);

    return (
        <div className="h-full w-full overflow-hidden rounded-md border border-gray-700 bg-[#1e1e1e]">
            <Editor
                height="100%"
                language={language === "cpp" ? "cpp" : "python"}
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
                }}
            />
        </div>
    );
}
