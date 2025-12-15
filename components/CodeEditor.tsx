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
    const disposablesRef = React.useRef<any[]>([]);

    // Cleanup disposables (completion providers) on unmount
    React.useEffect(() => {
        return () => {
            disposablesRef.current.forEach((d: any) => d.dispose());
            disposablesRef.current = [];
        };
    }, []);

    const handleEditorDidMount = (editor: any, monaco: any) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        // Force quick suggestions settings
        editor.updateOptions({
            quickSuggestions: { other: true, comments: true, strings: true },
            suggestOnTriggerCharacters: true
        });

        // Enable Emmet for HTML/CSS/JS
        try {
            if (language === "html") require("emmet-monaco-es").emmetHTML(monaco, ["html"]);
            else if (language === "css") require("emmet-monaco-es").emmetCSS(monaco, ["css"]);
            else if (language === "javascript") require("emmet-monaco-es").emmetHTML(monaco, ["javascript"]);
        } catch (e) { console.error(e); }

        const { languages } = monaco;

        // --- Python Snippets ---
        disposablesRef.current.push(languages.registerCompletionItemProvider('python', {
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
        }));

        // --- Java Snippets & Suggestions ---
        const suggestionsSnippets = [
            // --- Snippets ---
            {
                label: 'main',
                kind: monaco.languages.CompletionItemKind.Snippet,
                documentation: 'public static void main',
                insertText: 'public static void main(String[] args) {\n\t${1}\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            },
            {
                label: 'psvm',
                kind: monaco.languages.CompletionItemKind.Snippet,
                documentation: 'public static void main',
                insertText: 'public static void main(String[] args) {\n\t${1}\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            },
            {
                label: 'class',
                kind: monaco.languages.CompletionItemKind.Snippet,
                documentation: 'Class definition',
                insertText: 'class ${1:Name} {\n\t${2}\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            },
            {
                label: 'public class',
                kind: monaco.languages.CompletionItemKind.Snippet,
                documentation: 'Public Class definition',
                insertText: 'public class ${1:Name} {\n\t${2}\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            },
            {
                label: 'sout',
                kind: monaco.languages.CompletionItemKind.Snippet,
                documentation: 'System.out.println',
                insertText: 'System.out.println(${1:expression});',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            },
            {
                label: 'souf',
                kind: monaco.languages.CompletionItemKind.Snippet,
                documentation: 'System.out.printf',
                insertText: 'System.out.printf("${1:%s}", ${2:var});',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            },
            {
                label: 'fori',
                kind: monaco.languages.CompletionItemKind.Snippet,
                documentation: 'Indexed for loop',
                insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:limit}; ${1:i}++) {\n\t${3}\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            },
            {
                label: 'foreach',
                kind: monaco.languages.CompletionItemKind.Snippet,
                documentation: 'Enhanced for loop',
                insertText: 'for (${1:Type} ${2:item} : ${3:collection}) {\n\t${4}\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            },
            {
                label: 'else',
                kind: monaco.languages.CompletionItemKind.Snippet,
                documentation: 'Else block',
                insertText: 'else {\n\t${1}\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            },
            {
                label: 'if',
                kind: monaco.languages.CompletionItemKind.Snippet,
                documentation: 'If statement',
                insertText: 'if (${1:condition}) {\n\t${2}\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            },
            {
                label: 'ifelse',
                kind: monaco.languages.CompletionItemKind.Snippet,
                documentation: 'If-Else statement',
                insertText: 'if (${1:condition}) {\n\t${2}\n} else {\n\t${3}\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            },
            {
                label: 'trycatch',
                kind: monaco.languages.CompletionItemKind.Snippet,
                documentation: 'Try-Catch block',
                insertText: 'try {\n\t${1}\n} catch (${2:Exception} ${3:e}) {\n\t${3:e}.printStackTrace();\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            },

            // --- Keywords ---
            ...['abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while', 'true', 'false', 'null'].map(k => ({
                label: k,
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: k
            })),

            // --- Common Classes ---
            ...['String', 'Integer', 'Double', 'Boolean', 'Math', 'System', 'Object', 'Thread', 'Runnable', 'List', 'ArrayList', 'LinkedList', 'Map', 'HashMap', 'TreeMap', 'Set', 'HashSet', 'Collections', 'Arrays', 'Scanner'].map(c => ({
                label: c,
                kind: monaco.languages.CompletionItemKind.Class,
                insertText: c,
                documentation: 'Java Standard Library Class'
            }))
        ];

        // --- Common Methods (Scanner, String, List, etc.) ---
        const suggestionsMethods = [
            ...['nextInt', 'nextDouble', 'nextFloat', 'nextBoolean', 'nextLine', 'next', 'hasNext', 'close',
                'length', 'charAt', 'substring', 'equals', 'equalsIgnoreCase', 'contains', 'indexOf', 'lastIndexOf', 'isEmpty', 'trim', 'replace', 'split',
                'add', 'remove', 'get', 'set', 'size', 'clear', 'isEmpty', 'contains', 'addAll',
                'put', 'containsKey', 'containsValue', 'keySet', 'values', 'entrySet',
                'max', 'min', 'abs', 'sqrt', 'pow', 'random'].map(m => ({
                    label: m,
                    kind: monaco.languages.CompletionItemKind.Method,
                    insertText: m,
                    documentation: 'Common Java Method'
                }))
        ];

        const allJavaSuggestions = [...suggestionsSnippets, ...suggestionsMethods];
        disposablesRef.current.push(languages.registerCompletionItemProvider('java', {
            triggerCharacters: ['.'],
            provideCompletionItems: (model: any, position: any) => {
                return { suggestions: allJavaSuggestions };
            }
        }));

        // --- C++ Snippets ---
        disposablesRef.current.push(languages.registerCompletionItemProvider('cpp', {
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
                        label: 'cin',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        documentation: 'Standard Input',
                        insertText: 'std::cin >> ${1:variable};',
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
                    },
                    {
                        label: 'fori',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        documentation: 'Indexed for loop',
                        insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:limit}; ${1:i}++) {\n\t${3}\n}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                    }
                ]
            })
        }));
    };

    // Error Line Highlighting with Decorations
    const decorationsRef = React.useRef<any[]>([]);

    React.useEffect(() => {
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
            {/* Inject minimal CSS for the error line */}
            <style>{`
                .red-error-line {
                    background-color: rgba(69, 10, 10, 0.4);
                    border-left: 2px solid #ef4444;
                }
                .red-error-glyph {
                    background-color: #ef4444;
                    width: 8px;
                    height: 8px;
                    border-radius: 9999px;
                    margin-left: 4px;
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
                    glyphMargin: true,
                }}
            />
        </div>
    );
}
