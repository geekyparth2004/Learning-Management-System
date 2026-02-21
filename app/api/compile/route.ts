import { NextResponse } from "next/server";

const JUDGE0_API_URL = "https://ce.judge0.com/submissions?wait=true";

export async function POST(request: Request) {
    try {
        const { language, code, input } = await request.json();

        // Map languages to Judge0 IDs
        const languageMap: Record<string, number> = {
            "python": 71,       // Python (3.8.1)
            "cpp": 54,          // C++ (GCC 9.2.0)
            "c": 50,            // C (GCC 9.2.0)
            "java": 62,         // Java (OpenJDK 13.0.1)
            "javascript": 63,   // JavaScript (Node.js 12.14.0)
            "typescript": 74,   // TypeScript (3.7.4)
            "go": 60,           // Go (1.13.5)
            "rust": 73,         // Rust (1.40.0)
        };

        const languageId = languageMap[language.toLowerCase()] || 71;

        let normalizedInput = input || "";

        // Normalize input for Python to mimic cin behavior (token-based input)
        // This allows "3 2" to be read by two calls to input()
        if (language.toLowerCase() === "python") {
            normalizedInput = normalizedInput
                .replace(/,/g, " ")       // Replace commas with spaces
                .trim()
                .split(/\s+/)             // Split by any whitespace
                .join("\n");              // Join with newlines
        }

        const response = await fetch(JUDGE0_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                source_code: code,
                language_id: languageId,
                stdin: normalizedInput,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Judge0 Error:", errorText);
            throw new Error("Failed to execute code");
        }

        const data = await response.json();

        // Parse Judge0 response
        let output = data.stdout || "";
        let errorItem = data.compile_output || data.stderr || data.message || "";

        // Sometimes Judge0 returns status description in error if it's a TLE or specific error without stderr
        if (!errorItem && data.status && data.status.id > 3) {
            errorItem = data.status.description;
        }

        return NextResponse.json({
            output: output,
            error: errorItem || undefined
        });

    } catch (error) {
        console.error("Compilation error:", error);
        return NextResponse.json(
            { error: "Failed to compile/execute code" },
            { status: 500 }
        );
    }
}
