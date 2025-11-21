import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
    try {
        const { problemDescription, studentCode, mode } = await request.json();

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ message: "OpenAI API key not configured." }, { status: 500 });
        }

        let systemPrompt = "";
        if (mode === "guide") {
            systemPrompt = "You are a helpful coding tutor. The student is working on a programming problem. Analyze their code and the problem description. Provide a helpful hint or guidance on what might be wrong or missing. DO NOT give the full solution code. Keep it brief, encouraging, and guide them to find the answer themselves.";
        } else if (mode === "solution") {
            systemPrompt = "You are a helpful coding tutor. The student is stuck and has requested the solution. Provide the full correct solution code for the problem, along with a brief explanation of how it works and why it solves the problem.";
        } else {
            return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
        }

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Problem Description:\n${problemDescription}\n\nStudent Code:\n${studentCode}` }
            ],
            model: "gpt-4o",
        });

        const message = completion.choices[0].message.content;
        return NextResponse.json({ message });

    } catch (error) {
        console.error("Ask AI error:", error);
        return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
    }
}
