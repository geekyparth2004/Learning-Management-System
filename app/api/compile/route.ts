import { NextResponse } from "next/server";

const PISTON_API_URL = "https://emkc.org/api/v2/piston/execute";

export async function POST(request: Request) {
    try {
        const { language, code, input } = await request.json();

        const pistonLanguage = language === "cpp" ? "c++" : language;
        const version = language === "cpp" ? "10.2.0" : "3.10.0";

        const response = await fetch(PISTON_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                language: pistonLanguage,
                version: "*",
                files: [{ content: code }],
                stdin: input || "",
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
                // Runtime error (or non-zero exit code)
                // Sometimes stderr is useful, but Piston puts everything in output usually.
                // We can treat it as error if we want to highlight it, or just output.
                // For now, let's treat non-zero exit as potential error if output looks like an error.
                // But usually we just want to show the output.
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
