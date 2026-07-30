import { NextResponse } from "next/server";
import OpenAI from "openai";
import { stripRevealingComments } from "@/lib/strip-hints";

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
        if (Array.isArray(parsed.challenges)) return parsed.challenges;
        if (Array.isArray(parsed.data)) return parsed.data;
        if (Array.isArray(parsed.items)) return parsed.items;

        // Fallback: find first array property in object
        const firstArray = Object.values(parsed).find(v => Array.isArray(v));
        if (firstArray) return firstArray as any[];
    }
    return [];
}

// Adaptive rounds request one item at a time and pass what the student has already
// seen so the AI does not repeat itself as the level moves up and down.
function buildExclusionNote(exclude?: string[]): string {
    if (!Array.isArray(exclude) || exclude.length === 0) return "";
    const list = exclude.slice(-15).map(t => `- ${t}`).join("\n");
    return `\n\nThe candidate has ALREADY been asked the following. Do NOT repeat or rephrase any of them:\n${list}`;
}

export async function POST(req: Request) {
    try {
        const { type, role, level, questionCount, problemCount, topic, exclude, challengeCount, language } = await req.json();
        const difficulty = LEVEL_LABELS[level] || "Intermediate";
        const exclusionNote = buildExclusionNote(exclude);

        if (type === "mcq") {
            const count = questionCount || 10;
            const prompt = `You are an expert assessment designer for the role of "${role}".
Generate exactly ${count} multiple-choice question${count === 1 ? "" : "s"} at "${difficulty}" difficulty level (Level ${level}/10).

Level ${level} of 10 must be respected strictly: level 1 is trivial for a beginner, level 10 is expert-only.

Each question must:
- Be relevant to the "${role}" job role
- Have exactly 4 options labeled A, B, C, D
- Have exactly 1 correct answer${exclusionNote}

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

        if (type === "aptitude") {
            const count = questionCount || 10;
            const prompt = `You are an expert aptitude-test designer for campus placement exams.
Generate exactly ${count} aptitude multiple-choice question${count === 1 ? "" : "s"} at "${difficulty}" difficulty level (Level ${level}/10).

Mix the questions across these areas: quantitative aptitude (percentages, ratios, profit & loss, time & work, speed & distance), logical reasoning (series, coding-decoding, blood relations, syllogisms, seating arrangements), verbal ability (analogies, sentence completion), and data interpretation.

Level ${level} of 10 must be respected strictly: level 1 is basic single-step arithmetic or an obvious pattern; level 10 needs multi-step reasoning under tricky constraints.

Each question must:
- Be fully self-contained with every number needed to solve it
- Have exactly 4 options labeled A, B, C, D
- Have exactly 1 correct answer — double-check the arithmetic before choosing correctIndex${exclusionNote}

Return a JSON object with a key "questions" containing an array in this exact format:
{
  "questions": [
    {
      "question": "A shopkeeper sells an item at a 20% profit ...?",
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
Generate exactly ${count} coding problem${count === 1 ? "" : "s"} at "${difficulty}" difficulty level (Level ${level}/10).

Level ${level} of 10 must be respected strictly: level 1 is a trivial warm-up (basic I/O, single loop), level 10 is a hard algorithmic challenge.

Each problem must have:
- A clear title
- A detailed description explaining the problem, input format, output format, and constraints
- Default code templates for Python, Java, and C++. Each template should include the function signature and basic I/O boilerplate that reads from stdin and prints to stdout.
- At least 3 test cases (2 visible, 1 hidden) with input and expectedOutput strings${exclusionNote}

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

        if (type === "voice") {
            const prompt = `You are a technical interviewer conducting a spoken interview on the topic "${topic}".
Ask exactly ONE question at "${difficulty}" difficulty level (Level ${level}/10).

Level ${level} of 10 must be respected strictly: level 1 is a basic definition question a beginner could answer, level 10 requires deep expert reasoning.

Rules:
- The question must be answerable verbally. Do NOT ask the candidate to write code.
- Keep it short, concise, and focused on ONE concept.
- It must be strictly about "${topic}".${exclusionNote}

Return a JSON object in this exact format:
{ "question": "..." }`;

            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.8,
            });

            let content = completion.choices[0].message.content || "{}";
            content = content.replace(/```json\n?|```/g, "").trim();
            const parsed = JSON.parse(content);
            const question = parsed.question || parsed.nextQuestion || "";

            return NextResponse.json({ question });
        }

        if (type === "debug") {
            const count = challengeCount || 3;
            const langNames: Record<string, string> = { python: "Python", java: "Java", cpp: "C++" };
            const langName = langNames[language] || "Python";
            // What kind of bugs the AI should plant scales with the difficulty level.
            const bugMix =
                level <= 3 ? "exactly 1 syntax error (missing colon/semicolon/bracket, misspelled keyword, wrong indentation)" :
                level <= 6 ? "exactly 1 logical error (wrong operator, off-by-one, wrong variable used, incorrect condition) — the code must be syntactically valid" :
                level <= 8 ? "exactly 1 syntax error AND 1 logical error" :
                "2 or more subtle logical errors (edge-case handling, wrong loop bounds, state mutation mistakes) — the code must be syntactically valid";

            const prompt = `You are an expert debugging-assessment designer.
Generate exactly ${count} debugging challenge${count === 1 ? "" : "s"} in ${langName} at "${difficulty}" difficulty level (Level ${level}/10).

Each challenge is a small, complete ${langName} program that reads from stdin and prints to stdout, but contains ${bugMix}.

Rules for each challenge:
- The description must clearly state what the program is SUPPOSED to do (input format, output format) but must NOT reveal where the bugs are.
- The buggy code must be fixable with small edits — the correct overall approach is already there, only the planted bugs are wrong.
- Provide at least 3 test cases (2 visible, 1 hidden) that the CORRECTED program passes. The buggy program must fail to compile or produce wrong output on at least one of them.

ABSOLUTELY CRITICAL — do NOT hint at the bug anywhere in buggyCode:
- NEVER write a comment that points at a bug or states the correction. Banned examples: "// Should be num > 0", "# BUG here", "// fix this", "# wrong operator", "/* incorrect */", "// TODO", "// <---", "# off-by-one".
- NEVER use the words bug, buggy, fix, error, wrong, incorrect, mistake, typo, missing, should be, instead of, correct, or hint in ANY comment.
- Comments are allowed ONLY if they neutrally describe what the code does, exactly as they would appear in normal working code (e.g. "# Read input", "// Compute the total").
- The buggy code must look like ordinary code a developer wrote believing it was correct. A student must have to find the bug by reading the logic, not by reading a comment.${exclusionNote}

Return a JSON object with a key "challenges" containing an array in this exact format:
{
  "challenges": [
    {
      "title": "Sum of Evens",
      "description": "This program should read n, then n integers, and print the sum of the even ones...",
      "buggyCode": "n = int(input())\\nnums = list(map(int, input().split()))\\n...",
      "testCases": [
        { "input": "4\\n1 2 3 4", "expectedOutput": "6", "isHidden": false },
        { "input": "3\\n5 7 9", "expectedOutput": "0", "isHidden": false },
        { "input": "2\\n10 11", "expectedOutput": "10", "isHidden": true }
      ]
    }
  ]
}

IMPORTANT:
- buggyCode must be the complete program as plain text with \\n for newlines
- Input and output must be plain text strings (as they would appear in stdin/stdout)`;

            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.7,
            });

            let content = completion.choices[0].message.content || "{}";
            content = content.replace(/```json\n?|```/g, "").trim();
            const parsed = JSON.parse(content);
            const challenges = extractArrayFromJSON(parsed);

            // The prompt forbids give-away comments, but the model writes them anyway
            // ("// Should be num > 0"), which hands the student the answer. Strip them.
            const sanitized = challenges.map((c: any) => ({
                ...c,
                buggyCode: stripRevealingComments(c.buggyCode || "", language || "python"),
            }));

            return NextResponse.json({ challenges: sanitized });
        }

        if (type === "output") {
            const count = questionCount || 5;
            const prompt = `You are an expert code-reading assessment designer.
Generate exactly ${count} output-prediction question${count === 1 ? "" : "s"} at "${difficulty}" difficulty level (Level ${level}/10).

Each question is a short, self-contained code snippet; the student must predict exactly what it prints.

Rules for each snippet:
- It must be fully deterministic: NO user input, NO randomness, NO current time/date, NO environment access.
- It must actually print something via standard output.
- Level ${level}/10 guidance: level 1 is 2-4 trivial lines (simple prints and arithmetic); level 10 uses expert-level traps (operator precedence, integer vs float division, mutation and references, scope/closures, short-circuiting, string slicing edge cases).
- Prefer Python for most snippets, but Java, C++ or pseudocode are also allowed — set the "language" field accordingly.${exclusionNote}

Return a JSON object with a key "questions" containing an array in this exact format:
{
  "questions": [
    {
      "language": "python",
      "code": "x = [1, 2, 3]\\ny = x\\ny.append(4)\\nprint(len(x))",
      "expectedOutput": "4",
      "explanation": "y references the same list as x, so appending through y also grows x."
    }
  ]
}

IMPORTANT:
- expectedOutput must be EXACTLY what the program prints — every line, in order, with \\n between lines and no trailing commentary
- explanation is one or two sentences explaining why that is the output`;

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

        if (type === "sql") {
            const count = questionCount || 3;
            const prompt = `You are an expert SQL assessment designer.
Generate exactly ${count} SQL question${count === 1 ? "" : "s"} at "${difficulty}" difficulty level (Level ${level}/10) for SQLite.

Level ${level}/10 guidance: level 1 is a simple single-table SELECT with WHERE; level 5 uses JOINs, GROUP BY and aggregates; level 10 uses subqueries, HAVING, CASE, self-joins or window-function-free analytical logic.

Each question must have:
- A clear title
- A description that shows the table schema(s) with column names/types, a few sample rows, and exactly what the student's query must return (columns and their order)
- At least 3 test cases (2 visible, 1 hidden). Each test case has its own "setupSql" (CREATE TABLE + INSERT statements building the SAME schema with different data) and the "expectedOutput" the correct query produces on that data.

CRITICAL rules:
- Use only SQLite-compatible SQL in setupSql
- Every question MUST require an ORDER BY so the correct output is deterministic
- expectedOutput format: one row per line, cell values joined with " | " (space pipe space), no header row. NULL cells written as NULL. Empty result = empty string
- The expectedOutput must be EXACTLY what the reference solution returns on that test case's data — compute it carefully row by row

Return a JSON object with a key "questions" containing an array in this exact format:
{
  "questions": [
    {
      "title": "High Earners",
      "description": "Table: employees(id INTEGER, name TEXT, salary INTEGER)\\nSample rows: ...\\nWrite a query returning name, salary of employees earning above 50000, ordered by salary descending.",
      "testCases": [
        { "setupSql": "CREATE TABLE employees (id INTEGER, name TEXT, salary INTEGER); INSERT INTO employees VALUES (1,'Asha',60000),(2,'Ravi',45000),(3,'Meera',72000);", "expectedOutput": "Meera | 72000\\nAsha | 60000", "isHidden": false },
        { "setupSql": "CREATE TABLE employees (id INTEGER, name TEXT, salary INTEGER); INSERT INTO employees VALUES (1,'Dev',51000),(2,'Kiran',50000);", "expectedOutput": "Dev | 51000", "isHidden": false },
        { "setupSql": "CREATE TABLE employees (id INTEGER, name TEXT, salary INTEGER); INSERT INTO employees VALUES (1,'Zoya',90000),(2,'Om',90001),(3,'Tara',10000);", "expectedOutput": "Om | 90001\\nZoya | 90000", "isHidden": true }
      ]
    }
  ]
}`;

            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.5,
            });

            let content = completion.choices[0].message.content || "{}";
            content = content.replace(/```json\n?|```/g, "").trim();
            const parsed = JSON.parse(content);
            const questions = extractArrayFromJSON(parsed);

            return NextResponse.json({ questions });
        }

        if (type === "email") {
            const count = questionCount || 3;
            const prompt = `You are a business-communication examiner designing an email-writing assessment.
Generate exactly ${count} email-writing task${count === 1 ? "" : "s"} at "${difficulty}" difficulty level (Level ${level}/10).

Level ${level}/10 guidance: level 1 is a simple everyday email (leave request, thank-you note); level 5 involves workplace nuance (declining a meeting politely, following up on a delayed deliverable); level 10 is a delicate high-stakes email (escalating a problem to leadership, delivering bad news to a client, negotiating a deadline).

Each task must have:
- A short topic (what the email is about, one line)
- A scenario giving the student concrete context: who they are, who the recipient is, the situation, and what the email must achieve${exclusionNote}

Return a JSON object with a key "questions" containing an array in this exact format:
{
  "questions": [
    {
      "topic": "Request for deadline extension",
      "scenario": "You are a junior developer. Your team lead expects the payment-module testing to finish by Friday, but a critical bug will delay you by 3 days. Write an email to your team lead explaining the delay and requesting an extension."
    }
  ]
}`;

            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.8,
            });

            let content = completion.choices[0].message.content || "{}";
            content = content.replace(/```json\n?|```/g, "").trim();
            const parsed = JSON.parse(content);
            const questions = extractArrayFromJSON(parsed);

            return NextResponse.json({ questions });
        }

        return NextResponse.json({ error: "Invalid type. Use 'mcq', 'coding', 'voice', 'debug', 'output', 'sql' or 'email'." }, { status: 400 });

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
