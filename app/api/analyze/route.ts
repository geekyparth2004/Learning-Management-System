import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { code, language } = await req.json();

        if (!code) {
            return NextResponse.json(
                { message: "Code is required" },
                { status: 400 }
            );
        }

        // SIMULATED AI ANALYSIS
        // In a production environment, this would call OpenAI/Gemini API.
        // For this demo, we use heuristics to estimate complexity.

        let timeComplexity = "O(1)";
        let spaceComplexity = "O(1)";
        let suggestion = "Great job! Your code is optimized.";
        let reason = "No loops detected - constant time operations.";

        const loops = (code.match(/for\s*\(|while\s*\(/g) || []).length;
        const nestedLoops = (code.match(/for\s*\([^{]*\{[^}]*for\s*\(/g) || []).length; // Very basic check

        if (nestedLoops > 0 || (loops >= 2 && code.includes("for"))) {
            timeComplexity = "O(n²)";
            reason = "Nested loops detected - outer loop runs n times, inner loop runs n times for each iteration.";
            suggestion = "Consider optimizing nested loops. Try using hash maps, sorting, or two-pointer techniques.";
        } else if (loops === 1) {
            timeComplexity = "O(n)";
            reason = "Single loop detected - iterates through n elements once.";
            suggestion = "Linear time complexity is efficient for most use cases.";
        }

        if (code.includes("new Array") || code.includes("malloc") || code.includes("vector<") || (language === "python" && code.includes("= ["))) {
            spaceComplexity = "O(n)";
        }

        // Simulate network delay for realism (reduced)
        await new Promise((resolve) => setTimeout(resolve, 200));

        return NextResponse.json({
            timeComplexity,
            spaceComplexity,
            reason,
            suggestion,
        });
    } catch (error) {
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
