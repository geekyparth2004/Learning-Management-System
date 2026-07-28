import { NextResponse } from "next/server";
import { auth } from "@/auth";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-build",
});

// Grades a student's written email out of 10 marks on grammar and professionalism.
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { topic, scenario, email, difficulty } = await req.json();
        if (!topic || typeof email !== "string" || !email.trim()) {
            return NextResponse.json({ error: "Missing topic or email" }, { status: 400 });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-5-nano",
            messages: [
                {
                    role: "system",
                    content: `You are a strict but fair business-communication examiner grading a student's email in a proctored assessment.
Email difficulty context: ${difficulty || "Intermediate"}.

Grade the email out of 10 marks, starting from 10 and deducting for problems:
- Grammar, spelling, and punctuation errors (deduct up to 4 marks)
- Unprofessional tone, slang, or rudeness (deduct up to 3 marks)
- Missing email conventions — greeting, clear subject-appropriate body, sign-off (deduct up to 2 marks)
- Not addressing the given topic/scenario, or unclear purpose (deduct up to 3 marks)

An email that ignores the topic entirely or is gibberish scores 0-2. Do not award marks for length alone.

Return ONLY valid JSON:
{
  "marks": number (0-10 integer),
  "grammarIssues": number (count of grammar/spelling mistakes found),
  "feedback": "string (2-3 concise sentences: what was good, what cost marks)"
}`,
                },
                {
                    role: "user",
                    content: `Topic: ${topic}\n${scenario ? `Scenario: ${scenario}\n` : ""}\nStudent's email:\n${email}`,
                },
            ],
            response_format: { type: "json_object" },
        });

        let marks = 0;
        let grammarIssues = 0;
        let feedback = "";
        try {
            const content = (completion.choices[0].message.content || "{}").replace(/```json\n?|```/g, "").trim();
            const parsed = JSON.parse(content);
            marks = Math.max(0, Math.min(10, Math.round(Number(parsed.marks) || 0)));
            grammarIssues = Math.max(0, Math.round(Number(parsed.grammarIssues) || 0));
            feedback = typeof parsed.feedback === "string" ? parsed.feedback : "";
        } catch {
            marks = 0;
            feedback = "Your email could not be evaluated.";
        }

        return NextResponse.json({ marks, grammarIssues, feedback });
    } catch (error: any) {
        console.error("Email evaluation failed", error);
        return NextResponse.json(
            { error: error.message || "Failed to evaluate email" },
            { status: error.status || 500 }
        );
    }
}
