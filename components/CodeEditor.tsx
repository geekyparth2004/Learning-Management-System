"use client";

import React from "react";
import Editor from "@monaco-editor/react";
import { Language } from "@/types";

// Pre-load Monaco to avoid delays
// Loader init removed to prevent SSR build error

interface CodeEditorProps {
    language: Language;
    code: string;
    onChange: (value: string | undefined) => void;
    errorLine?: number | null;
    errorMessage?: string | null;
    readOnly?: boolean;
}

const CodeEditor = React.memo(({
    language,
    code,
    onChange,
    errorLine,
    errorMessage,
    readOnly = false,
}: CodeEditorProps) => {
    const editorRef = React.useRef<any>(null);
    const monacoRef = React.useRef<any>(null);
    const disposablesRef = React.useRef<any[]>([]);

    // Cleanup disposables on unmount
    React.useEffect(() => {
        return () => {
            disposablesRef.current.forEach((d: any) => d.dispose());
            disposablesRef.current = [];
        };
    }, []);

    const handleEditorDidMount = (editor: any, monaco: any) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        // Enhanced Editor Configuration
        editor.updateOptions({
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            readOnly: readOnly,
            domReadOnly: readOnly,
            quickSuggestions: { other: true, comments: true, strings: true },
            suggestOnTriggerCharacters: true,
            wordBasedSuggestions: "currentDocument",
            acceptSuggestionOnEnter: "on",
            tabCompletion: "on",
            autoClosingBrackets: "always",
            autoClosingQuotes: "always",
            formatOnType: true,
            formatOnPaste: true,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            fontLigatures: true,
            glyphMargin: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true,
        });

        // Enable Emmet
        try {
            if (language === "html" || language === "javascript") {
                require("emmet-monaco-es").emmetHTML(monaco, ["html", "javascript"]);
            } else if (language === "css") {
                require("emmet-monaco-es").emmetCSS(monaco, ["css"]);
            }
        } catch (e) { }

        // Register Language Extensions
        registerJavaExtensions(monaco);
        registerPythonExtensions(monaco);
        registerCppExtensions(monaco);
    };

    const registerJavaExtensions = (monaco: any) => {
        const { languages } = monaco;

        // Dispose previous providers to prevent duplicates upon remount
        // (Though React.memo buffers this, safety first)

        const javaSnippets = [
            { label: 'psvm', insertText: 'public static void main(String[] args) {\n\t${1}\n}', doc: 'Main Method' },
            { label: 'sout', insertText: 'System.out.println(${1});', doc: 'Print Line' },
            { label: 'souf', insertText: 'System.out.printf("${1:%s}", ${2});', doc: 'Printf' },
            { label: 'fori', insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t${3}\n}', doc: 'For Loop' },
            { label: 'foreach', insertText: 'for (${1:Type} ${2:item} : ${3:collection}) {\n\t${4}\n}', doc: 'Enhanced For Loop' },
            { label: 'trycatch', insertText: 'try {\n\t${1}\n} catch (${2:Exception} ${3:e}) {\n\t${3}.printStackTrace();\n}', doc: 'Try-Catch' },
            { label: 'if', insertText: 'if (${1:condition}) {\n\t${2}\n}', doc: 'If Statement' },
            { label: 'ifelse', insertText: 'if (${1:condition}) {\n\t${2}\n} else {\n\t${3}\n}', doc: 'If-Else' },
            // Collections
            { label: 'list', insertText: 'List<${1:String}> ${2:list} = new ArrayList<>();', doc: 'New ArrayList' },
            { label: 'map', insertText: 'Map<${1:String}, ${2:Integer}> ${3:map} = new HashMap<>();', doc: 'New HashMap' },
            { label: 'set', insertText: 'Set<${1:String}> ${2:set} = new HashSet<>();', doc: 'New HashSet' },
            { label: 'queue', insertText: 'Queue<${1:Integer}> ${2:queue} = new LinkedList<>();', doc: 'New Queue' },
            { label: 'stack', insertText: 'Stack<${1:Integer}> ${2:stack} = new Stack<>();', doc: 'New Stack' },
            // IO
            { label: 'scanner', insertText: 'Scanner sc = new Scanner(System.in);', doc: 'New Scanner' },
            { label: 'br', insertText: 'BufferedReader br = new BufferedReader(new InputStreamReader(System.in));', doc: 'BufferedReader' },
        ];

        // Java Common Classes
        const javaClasses = [
            'String', 'Integer', 'Double', 'Boolean', 'Character', 'Long', 'Math', 'System', 'Object',
            'StringBuilder', 'StringBuffer',
            'List', 'ArrayList', 'LinkedList',
            'Map', 'HashMap', 'TreeMap', 'LinkedHashMap',
            'Set', 'HashSet', 'TreeSet',
            'Queue', 'PriorityQueue', 'Deque', 'ArrayDeque',
            'Stack', 'Vector',
            'Collections', 'Arrays', 'Iterator',
            'Scanner', 'BufferedReader', 'InputStreamReader', 'PrintWriter',
            'File', 'IOException', 'Exception', 'RuntimeException'
        ];

        disposablesRef.current.push(languages.registerCompletionItemProvider('java', {
            provideCompletionItems: (model: any, position: any) => {
                const suggestions = [
                    ...javaSnippets.map(s => ({
                        label: s.label,
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        documentation: s.doc,
                        insertText: s.insertText,
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                    })),
                    ...javaClasses.map(c => ({
                        label: c,
                        kind: monaco.languages.CompletionItemKind.Class,
                        insertText: c,
                        documentation: `java.util.${c}`
                    }))
                ];
                return { suggestions };
            }
        }));
    };

    const registerPythonExtensions = (monaco: any) => {
        disposablesRef.current.push(monaco.languages.registerCompletionItemProvider('python', {
            provideCompletionItems: () => ({
                suggestions: [
                    { label: 'def', insertText: 'def ${1:name}(${2:args}):\n\t${3:pass}', kind: monaco.languages.CompletionItemKind.Snippet },
                    { label: 'print', insertText: 'print(${1})', kind: monaco.languages.CompletionItemKind.Snippet },
                    { label: 'if', insertText: 'if ${1:condition}:\n\t${2:pass}', kind: monaco.languages.CompletionItemKind.Snippet },
                    { label: 'for', insertText: 'for ${1:x} in ${2:iterable}:\n\t${3:pass}', kind: monaco.languages.CompletionItemKind.Snippet },
                    { label: 'list', insertText: '${1:list} = [${2}]', kind: monaco.languages.CompletionItemKind.Snippet },
                    { label: 'dict', insertText: '${1:dict} = {${2}}', kind: monaco.languages.CompletionItemKind.Snippet },
                ]
            })
        }));
    };

    const registerCppExtensions = (monaco: any) => {
        disposablesRef.current.push(monaco.languages.registerCompletionItemProvider('cpp', {
            provideCompletionItems: () => ({
                suggestions: [
                    { label: 'cout', insertText: 'std::cout << ${1} << std::endl;', kind: monaco.languages.CompletionItemKind.Snippet },
                    { label: 'cin', insertText: 'std::cin >> ${1};', kind: monaco.languages.CompletionItemKind.Snippet },
                    { label: 'include', insertText: '#include <${1:iostream}>', kind: monaco.languages.CompletionItemKind.Snippet },
                    { label: 'main', insertText: 'int main() {\n\t${1}\n\treturn 0;\n}', kind: monaco.languages.CompletionItemKind.Snippet },
                    { label: 'vector', insertText: 'std::vector<${1:int}> ${2:v};', kind: monaco.languages.CompletionItemKind.Snippet },
                ]
            })
        }));
    };

    // Error Line Highlighting
    const decorationsRef = React.useRef<any[]>([]);
    React.useEffect(() => {
        if (!editorRef.current || !monacoRef.current) return;
        const editor = editorRef.current;
        const monaco = monacoRef.current;

        if (errorLine) {
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
            editor.revealLineInCenter(errorLine);
        } else {
            decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
        }
    }, [errorLine]);

    return (
        <div className="relative h-full w-full overflow-hidden rounded-md border border-gray-800 bg-[#1e1e1e]">
            <style>{`
                .red-error-line { background-color: rgba(69, 10, 10, 0.4); border-left: 2px solid #ef4444; }
                .red-error-glyph { background-color: #ef4444; width: 8px; height: 8px; border-radius: 9999px; margin-left: 4px; }
            `}</style>
            <Editor
                height="100%"
                language={language}
                value={code}
                theme="vs-dark"
                onChange={onChange}
                onMount={handleEditorDidMount}
                loading={<div className="text-gray-500 text-sm p-4">Loading Editor...</div>}
            // Key: Force re-mount if language changes to ensure fresh providers
            // key={language} 
            // Actually keep same instance for performance, providers are managed via disposables
            />
        </div>
    );
});

export default CodeEditor;
