import { NextResponse } from "next/server";

const PISTON_API_URL = "https://emkc.org/api/v2/piston/execute";

export async function POST(request: Request) {
    try {
        const { language, code, input } = await request.json();

        const pistonLanguage = language === "cpp" ? "c++" : language;
        const version = language === "cpp" ? "10.2.0" : "3.10.0";

        let normalizedInput = input || "";

        // Normalize input for Python to mimic cin behavior (token-based input)
        // This allows "3 2" to be read by two calls to input()
        if (language === "python") {
            normalizedInput = normalizedInput
                .replace(/,/g, " ")       // Replace commas with spaces
                .trim()
                .split(/\s+/)             // Split by any whitespace
                .join("\n");              // Join with newlines
        }

        const response = await fetch(PISTON_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                language: pistonLanguage,
                version: "*",
                files: [{ content: code }],
                stdin: normalizedInput,
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to execute code");
        }

        const data = await response.json();

        // Parse Piston response
        // Piston returns { run: { output: "...", code: 0 }, compile: { output: "...", code: 0 } }

        let output = "";
        let error = "";

        if (data.compile && data.compile.code !== 0) {
            error = data.compile.output; // Compilation error
        } else if (data.run) {
            output = data.run.output;
            if (data.run.code !== 0) {
                // Runtime error
                error = data.run.output;
            }
        } else {
            error = "No output from execution environment";
        }

        return NextResponse.json({
            output: output,
            error: error || undefined
        });

    } catch (error) {
        console.error("Compilation error:", error);
        return NextResponse.json(
            { error: "Failed to compile/execute code" },
            { status: 500 }
        );
    }
}
