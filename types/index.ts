export interface TestCase {
    id: string;
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
}

export interface Problem {
    id: string;
    title: string;
    description: string;
    defaultCode: {
        cpp: string;
        python: string;
        java: string;
    };
    testCases: TestCase[];
}

export interface Assignment {
    id: string;
    title: string;
    problems: Problem[];
}

export type Language = "cpp" | "python" | "java" | "html" | "css" | "javascript";

export interface ExecutionResult {
    output: string;
    error?: string;
    status: "success" | "error" | "timeout";
}
