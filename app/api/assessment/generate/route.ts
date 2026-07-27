import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-build",
});

const LEVEL_LABELS: Record<number, string> = {
    1: "Beginner", 2: "Beginner+", 3: "Elementary", 4: "Elementary+", 5: "Intermediate",
    6: "Intermediate+", 7: "Advanced", 8: "Advanced+", 9: "Expert", 10: "Master",
};

function extractArrayFromJSON(parsed: any): any[] {
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === "object" && parsed !== null) {
        if (Array.isArray(parsed.questions)) return parsed.questions;
        if (Array.isArray(parsed.problems)) return parsed.problems;
        if (Array.isArray(parsed.data)) return parsed.data;
        if (Array.isArray(parsed.items)) return parsed.items;

        // Fallback: find first array property in object
        const firstArray = Object.values(parsed).find(v => Array.isArray(v));
        if (firstArray) return firstArray as any[];
    }
    return [];
}

export async function POST(req: Request) {
    try {
        const { type, role, level, questionCount, problemCount, topic } = await req.json();
        const difficulty = LEVEL_LABELS[level] || "Intermediate";

        if (type === "mcq") {
            const count = questionCount || 10;
            const prompt = `You are an expert assessment designer for the role of "${role}".
Generate exactly ${count} multiple-choice questions at "${difficulty}" difficulty level (Level ${level}/10).

Each question must:
- Be relevant to the "${role}" job role
- Have exactly 4 options labeled A, B, C, D
- Have exactly 1 correct answer

Return a JSON object with a key "questions" containing an array in this exact format:
{
  "questions": [
    {
      "question": "What is ...?",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correctIndex": 0
    }
  ]
}

correctIndex is the 0-based index of the correct option (0=A, 1=B, 2=C, 3=D).`;

            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.7,
            });

            let content = completion.choices[0].message.content || "{}";
            content = content.replace(/```json\n?|```/g, "").trim();
            const parsed = JSON.parse(content);
            const questions = extractArrayFromJSON(parsed);

            return NextResponse.json({ questions });
        }

        if (type === "coding") {
            const count = problemCount || 3;
            const prompt = `You are an expert coding assessment designer.
Generate exactly ${count} coding problems at "${difficulty}" difficulty level (Level ${level}/10).

Each problem must have:
- A clear title
- A detailed description explaining the problem, input format, output format, and constraints
- Default code templates for Python, Java, and C++. Each template should include the function signature and basic I/O boilerplate that reads from stdin and prints to stdout.
- At least 3 test cases (2 visible, 1 hidden) with input and expectedOutput strings

Return a JSON object with a key "problems" containing an array in this exact format:
{
  "problems": [
    {
      "title": "Two Sum",
      "description": "Given an array of integers nums and an integer target, return indices of the two numbers...",
      "defaultCode": {
        "python": "# Read input\\nn = int(input())\\nnums = list(map(int, input().split()))\\ntarget = int(input())\\n\\n# Your code here\\n",
        "java": "import java.util.*;\\npublic class Main {\\n    public static void main(String[] args) {\\n        Scanner sc = new Scanner(System.in);\\n        // Your code here\\n    }\\n}",
        "cpp": "#include <iostream>\\nusing namespace std;\\nint main() {\\n    // Your code here\\n    return 0;\\n}"
      },
      "testCases": [
        { "input": "4\\n2 7 11 15\\n9", "expectedOutput": "0 1", "isHidden": false },
        { "input": "3\\n3 2 4\\n6", "expectedOutput": "1 2", "isHidden": false },
        { "input": "2\\n3 3\\n6", "expectedOutput": "0 1", "isHidden": true }
      ]
    }
  ]
}

IMPORTANT:
- Input and output must be plain text strings (as they would appear in stdin/stdout)
- Use newlines (\\n) to separate multiple lines in input/output`;

            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.7,
            });

            let content = completion.choices[0].message.content || "{}";
            content = content.replace(/```json\n?|```/g, "").trim();
            const parsed = JSON.parse(content);
            const problems = extractArrayFromJSON(parsed);

            return NextResponse.json({ problems });
        }

        return NextResponse.json({ error: "Invalid type. Use 'mcq' or 'coding'." }, { status: 400 });

    } catch (error: any) {
        console.error("Assessment generation error:", error);
        let errorMessage = "Failed to generate assessment content";
        if (error.code === "insufficient_quota") {
            errorMessage = "OpenAI API Quota Exceeded. Please check your billing details.";
        } else if (error.status === 429) {
            errorMessage = "Too many requests. Please try again later.";
        } else if (error.message) {
            errorMessage = error.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: error.status || 500 });
    }
}
