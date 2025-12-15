"use client";

import React from "react";
import Editor from "@monaco-editor/react";
import { Language } from "@/types";

interface CodeEditorProps {
    language: Language;
    code: string;
    onChange: (value: string | undefined) => void;
    errorLine?: number | null;
    errorMessage?: string | null;
    readOnly?: boolean;
}

export default function CodeEditor({
    language,
    code,
    onChange,
    errorLine,
    errorMessage,
    readOnly = false,
}: CodeEditorProps) {
    const editorRef = React.useRef<any>(null);
    const monacoRef = React.useRef<any>(null);

    const handleEditorDidMount = (editor: any, monaco: any) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        // Enable Emmet for HTML/CSS/JS
        if (language === "html") {
            try { require("emmet-monaco-es").emmetHTML(monaco, ["html"]); } catch (e) { console.error(e); }
        } else if (language === "css") {
            try { require("emmet-monaco-es").emmetCSS(monaco, ["css"]); } catch (e) { console.error(e); }
        } else if (language === "javascript") {
            try { require("emmet-monaco-es").emmetHTML(monaco, ["javascript"]); } catch (e) { console.error(e); }
        }

        // Register custom snippets for C++/Java/Python
        // We use a simple check to avoid duplicate registration if possible, or just register every time (Monaco handles it but it might duplicate suggestions if not careful).
        // Best practice: Register globally once. But we are in a component.
        // We will simple add a "disposable" to the editor instance if possible, or just rely on the fact that we mount rarely.
        // Actually, languages.registerCompletionItemProvider is global.
        // Let's check if we can add it to the 'editor' instance specifically? No, it's global.
        // So we should do it outside the component or in a Once effect.

        // For now, defining them inline for the active language.
        const { languages } = monaco;

        // Python Snippets
        if (language === "python") {
            languages.registerCompletionItemProvider('python', {
                provideCompletionItems: () => ({
                    suggestions: [
                        {
                            label: 'def',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            documentation: 'Define a function',
                            insertText: 'def ${1:name}(${2:args}):\n\t${3:pass}',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                        },
                        {
                            label: 'print',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            documentation: 'Print statement',
                            insertText: 'print(${1:expression})',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                        },
                        {
                            label: 'if',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            documentation: 'If statement',
                            insertText: 'if ${1:condition}:\n\t${2:pass}',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                        },
                        {
                            label: 'for',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            documentation: 'For loop',
                            insertText: 'for ${1:item} in ${2:iterable}:\n\t${3:pass}',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                        }
                    ]
                })
            });
        }

        // Java Snippets
        if (language === "java") {
            languages.registerCompletionItemProvider('java', {
                provideCompletionItems: () => ({
                    suggestions: [
                        {
                            label: 'sout',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            documentation: 'System.out.println',
                            insertText: 'System.out.println(${1:expression});',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                        },
                        {
                            label: 'psvm',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            documentation: 'Public Static Void Main',
                            insertText: 'public static void main(String[] args) {\n\t${1}\n}',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                        },
                        {
                            label: 'class',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            documentation: 'Class definition',
                            insertText: 'class ${1:Name} {\n\t${2}\n}',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                        }
                    ]
                })
            });
        }

        // C++ Snippets
        if (language === "cpp") {
            languages.registerCompletionItemProvider('cpp', {
                provideCompletionItems: () => ({
                    suggestions: [
                        {
                            label: 'cout',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            documentation: 'Standard Output',
                            insertText: 'std::cout << ${1:expression} << std::endl;',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                        },
                        {
                            label: 'include',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            documentation: 'Include header',
                            insertText: '#include <${1:iostream}>',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                        },
                        {
                            label: 'main',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            documentation: 'Main function',
                            insertText: 'int main() {\n\t${1}\n\treturn 0;\n}',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                        }
                    ]
                })
            });
        }
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
                            message: errorMessage || "Error here",
                            severity: monacoRef.current.MarkerSeverity.Error,
                        },
                    ]);
                } else {
                    if (!editorRef.current || !monacoRef.current) return;

                    const editor = editorRef.current;
                    const monaco = monacoRef.current;

                    if (errorLine) {
                        // Add decoration
                        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
                            {
                                range: new monaco.Range(errorLine, 1, errorLine, 1),
                                options: {
                                    isWholeLine: true,
                                    className: "red-error-line",
                                    glyphMarginClassName: "red-error-glyph",
                                },
                            },
                        ]);
                        // Scroll to error
                        editor.revealLineInCenter(errorLine);
                    } else {
                        // Clear decorations
                        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
                    }
                }, [errorLine]);

    return (
        <div className="relative h-full w-full overflow-hidden rounded-md border border-gray-800 bg-[#1e1e1e]">
            {/* Inject minimal CSS for the error line if Tailwind doesn't penetrate or if we want custom look */}
            <style jsx global>{`
                .red-error-line {
                    background-color: rgba(69, 10, 10, 0.4); /* red-900/40 */
                    border-left: 2px solid #ef4444; /* red-500 */
                }
                .red-error-glyph {
                    background-color: #ef4444; /* red-500 */
                    width: 8px; /* w-2 */
                    height: 8px; /* h-2 */
                    border-radius: 9999px; /* rounded-full */
                    margin-left: 4px; /* ml-1 */
                }
            `}</style>

            <Editor
                height="100%"
                language={language}
                value={code}
                theme="vs-dark"
                onChange={onChange}
                onMount={handleEditorDidMount}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 },
                    readOnly: readOnly,
                    domReadOnly: readOnly,
                    quickSuggestions: true,
                    suggestOnTriggerCharacters: true,
                    wordBasedSuggestions: "currentDocument",
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                    fontLigatures: true,
                    glyphMargin: true, // Enable glyph margin for error indicators
                }}
            />
        </div>
    );
}
