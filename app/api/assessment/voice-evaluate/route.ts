import { NextResponse } from "next/server";
import { auth } from "@/auth";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-build",
});

// Transcribes a student's spoken answer and has AI grade it out of 5 marks.
// The audio is processed in-memory only — nothing is stored.
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const formData = await req.formData();
        const audio = formData.get("audio");
        const question = (formData.get("question") as string) || "";
        const topic = (formData.get("topic") as string) || "General";
        const difficulty = (formData.get("difficulty") as string) || "Intermediate";

        if (!(audio instanceof File) || !question) {
            return NextResponse.json({ error: "Missing audio or question" }, { status: 400 });
        }

        // 1. Transcribe
        let transcript = "";
        try {
            const transcription = await openai.audio.transcriptions.create({
                file: audio,
                model: "whisper-1",
            });
            transcript = (transcription.text || "").trim();
        } catch (err) {
            console.error("Transcription failed", err);
        }

        if (!transcript) {
            return NextResponse.json({
                transcript: "",
                marks: 0,
                feedback: "We could not hear or transcribe your answer, so no marks were awarded for this question.",
            });
        }

        // 2. Evaluate
        const completion = await openai.chat.completions.create({
            model: "gpt-5-nano",
            messages: [
                {
                    role: "system",
                    content: `You are a strict but fair technical interviewer grading a spoken answer in a proctored assessment.
Topic: ${topic}. Difficulty: ${difficulty}.

Grade the candidate's answer to the question out of 5 marks:
- 5: fully correct and complete
- 3-4: mostly correct with minor gaps
- 1-2: partially correct or vague
- 0: wrong, irrelevant, or no real answer

The transcript comes from speech-to-text, so ignore small transcription artifacts and filler words.

Return ONLY valid JSON: { "marks": number (0-5 integer), "feedback": "string (1-2 concise sentences explaining the marks)" }`,
                },
                {
                    role: "user",
                    content: `Question: ${question}\n\nCandidate's answer (transcribed): ${transcript}`,
                },
            ],
            response_format: { type: "json_object" },
        });

        let marks = 0;
        let feedback = "";
        try {
            const content = (completion.choices[0].message.content || "{}").replace(/```json\n?|```/g, "").trim();
            const parsed = JSON.parse(content);
            marks = Math.max(0, Math.min(5, Math.round(Number(parsed.marks) || 0)));
            feedback = typeof parsed.feedback === "string" ? parsed.feedback : "";
        } catch {
            marks = 0;
            feedback = "Your answer could not be evaluated.";
        }

        return NextResponse.json({ transcript, marks, feedback });
    } catch (error: any) {
        console.error("Voice evaluation failed", error);
        return NextResponse.json(
            { error: error.message || "Failed to evaluate answer" },
            { status: error.status || 500 }
        );
    }
}
