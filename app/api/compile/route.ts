import { NextResponse } from "next/server";

// ─── Piston API (Primary — fast, free, no key needed) ────────────────────────
// Typical latency: 200–500ms. Supports all major languages with no rate limits
// on the public instance.
const PISTON_URL = "https://emkc.org/api/v2/piston/execute";

// ─── Judge0 Community Edition (Fallback) ─────────────────────────────────────
// Only used if Piston fails. Slower due to shared queue.
const JUDGE0_URL = "https://ce.judge0.com/submissions?wait=true";

// Language runtime configs for Piston
const PISTON_LANG_MAP: Record<string, { language: string; version: string }> = {
    python:     { language: "python",     version: "3.10.0"  },
    cpp:        { language: "c++",        version: "10.2.0"  },
    c:          { language: "c",          version: "10.2.0"  },
    java:       { language: "java",       version: "15.0.2"  },
    javascript: { language: "javascript", version: "18.15.0" },
    typescript: { language: "typescript", version: "5.0.3"   },
    go:         { language: "go",         version: "1.16.2"  },
    rust:       { language: "rust",       version: "1.50.0"  },
};

// Language IDs for Judge0 fallback
const JUDGE0_LANG_MAP: Record<string, number> = {
    python:     71,
    cpp:        54,
    c:          50,
    java:       62,
    javascript: 63,
    typescript: 74,
    go:         60,
    rust:       73,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeInput(language: string, input: string): string {
    let normalized = (input || "").replace(/[\[\]]/g, "").replace(/,/g, " ").trim();
    // Python reads line-by-line via input(); split tokens into separate lines
    if (language === "python") {
        normalized = normalized.split(/\s+/).join("\n");
    }
    return normalized;
}

function normalizeJavaClass(code: string): string {
    let fixed = code.replace(/public\s+class\s+[a-zA-Z0-9_]+/i, "public class Main");
    if (!fixed.includes("public class Main")) {
        fixed = fixed.replace(/class\s+[a-zA-Z0-9_]+/i, "class Main");
    }
    return fixed;
}

// Fetch with an AbortController-based timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        return res;
    } finally {
        clearTimeout(timer);
    }
}

// ─── Piston executor ─────────────────────────────────────────────────────────

async function runWithPiston(
    language: string,
    code: string,
    stdin: string
): Promise<{ output: string; error?: string }> {
    const runtime = PISTON_LANG_MAP[language];
    if (!runtime) throw new Error(`Unsupported language for Piston: ${language}`);

    const response = await fetchWithTimeout(
        PISTON_URL,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                language: runtime.language,
                version: runtime.version,
                files: [{ content: code }],
                stdin,
                run_timeout: 5000,   // 5s hard cap inside Piston sandbox
                compile_timeout: 10000,
            }),
        },
        8000 // 8s overall HTTP timeout
    );

    if (!response.ok) {
        throw new Error(`Piston HTTP ${response.status}`);
    }

    const data = await response.json();
    const run = data.run || {};
    const compile = data.compile || {};

    // Compile error (C++, Java, Rust etc.)
    if (compile.code !== undefined && compile.code !== 0) {
        return { output: "", error: compile.stderr || compile.output || "Compilation failed" };
    }

    // Runtime error / non-zero exit
    if (run.code !== 0 && run.stderr) {
        return { output: run.stdout || "", error: run.stderr };
    }

    return { output: run.stdout || "", error: run.stderr || undefined };
}

// ─── Judge0 fallback executor ─────────────────────────────────────────────────

async function runWithJudge0(
    language: string,
    code: string,
    stdin: string
): Promise<{ output: string; error?: string }> {
    const languageId = JUDGE0_LANG_MAP[language] || 71;

    const response = await fetchWithTimeout(
        JUDGE0_URL,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                source_code: code,
                language_id: languageId,
                stdin,
            }),
        },
        15000 // 15s — Judge0 free tier can be slow
    );

    if (!response.ok) throw new Error(`Judge0 HTTP ${response.status}`);

    const data = await response.json();
    let error = data.compile_output || data.stderr || data.message || "";
    if (!error && data.status && data.status.id > 3) {
        error = data.status.description;
    }

    return { output: data.stdout || "", error: error || undefined };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
    try {
        const { language, code, input } = await request.json();
        const lang = (language || "python").toLowerCase();

        let normalizedCode = code;
        if (lang === "java") {
            normalizedCode = normalizeJavaClass(code);
        }
        const stdin = normalizeInput(lang, input);

        // Try Piston first (fast), fall back to Judge0 if it errors
        try {
            const result = await runWithPiston(lang, normalizedCode, stdin);
            return NextResponse.json({ output: result.output, error: result.error });
        } catch (pistonErr) {
            console.warn("Piston failed, falling back to Judge0:", pistonErr);
        }

        const result = await runWithJudge0(lang, normalizedCode, stdin);
        return NextResponse.json({ output: result.output, error: result.error });

    } catch (error) {
        console.error("Compilation error:", error);
        return NextResponse.json(
            { error: "Failed to compile/execute code" },
            { status: 500 }
        );
    }
}
