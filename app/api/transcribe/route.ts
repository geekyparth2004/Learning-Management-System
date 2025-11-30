import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // OpenAI expects a File object, but we need to ensure it's handled correctly in Node environment
        // However, the OpenAI Node SDK handles File objects from formData nicely in recent versions.

        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: "whisper-1",
            language: "en", // Force English for consistency
        });

        return NextResponse.json({ text: transcription.text });

    } catch (error: any) {
        console.error("Transcription error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to transcribe audio" },
            { status: 500 }
        );
    }
}
