import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert Technical Interviewer. Your goal is to conduct an interview and ask follow-up questions.

When the user provides an answer:
1. Acknowledge the answer briefly if needed.
2. Ask the next relevant follow-up question or a new question.

If the user response is "[Audio Response Provided]", it means the user submitted an audio recording which you cannot hear.
In this case:
1. Do NOT analyze the answer or provide feedback/rating.
2. Simply acknowledge receipt (e.g., "Response recorded.") and ask the next relevant question based on the interview context/topic.

Return your response in this JSON format:
{
    "nextQuestion": "string"
}

If this is the start of the interview (no user answer provided), just return:
{
    "nextQuestion": "string (The actual first question to ask)"
}
`;

export async function POST(req: Request) {
    try {
        const { messages, userResponse, questionCount, type, projectContext, subject } = await req.json();

        let systemPrompt = SYSTEM_PROMPT;
        let difficulty = "Very Easy";

        if (type === "project") {
            // Project Interview Logic
            if (questionCount <= 7) difficulty = "Easy";
            else difficulty = "Medium";

            systemPrompt = `You are an expert Technical Interviewer conducting a project-based interview.
            The candidate has worked on the following project:
            
            ${projectContext}
            
            Your goal is to ask relevant technical and architectural questions based on this project.
            
            When the user provides an answer:
            1. Rate the answer on a scale of 1-10.
            2. Provide specific feedback on technical accuracy and depth.
            3. Provide a "Perfect Answer" example that would get a 10/10.
            4. Ask the next relevant follow-up question or a new question about the project.
            
            Return your response in this JSON format:
            {
                "rating": number,
                "feedback": "string",
                "suggestedAnswer": "string",
                "nextQuestion": "string"
            }
            
            If this is the start of the interview (no user answer provided), just return:
            {
                "nextQuestion": "string (The actual first question to ask)"
            }
            `;
        } else if (type === "core") {
            // Core Subject Interview Logic
            if (questionCount <= 7) difficulty = "Very Easy";
            else difficulty = "Easy";

            systemPrompt = `You are a Computer Science Professor conducting an oral exam on ${subject}.
            Goal: Ask conceptual questions to test understanding. Do NOT ask for code implementation.
            
            Response Format:
            {
                "rating": number (1-10),
                "feedback": "string (concise)",
                "suggestedAnswer": "string (brief)",
                "nextQuestion": "string"
            }
            
            Start: Return a JSON object with "nextQuestion" containing the actual first question about the subject.
            `;
        } else if (type === "dsa") {
            // DSA Interview Logic
            difficulty = "Easy";

            systemPrompt = `You are a Technical Interviewer conducting a DSA interview on ${subject}.
            Goal: Ask conceptual and logic-based interview questions. Do NOT ask the user to write code. Focus on approach and theory.
            
            Response Format:
            {
                "rating": number (1-10),
                "feedback": "string (concise)",
                "suggestedAnswer": "string (logic only)",
                "nextQuestion": "string"
            }
            
            Start: Return a JSON object with "nextQuestion" containing the actual first question about the subject.
            `;
        } else if (type === "sql") {
            // SQL Interview Logic
            difficulty = "Easy";

            systemPrompt = `You are a Database Expert conducting a SQL interview on ${subject}.
            Goal: Ask about SQL concepts, normalization, and logic. Do NOT ask the user to write full queries.
            
            Response Format:
            {
                "rating": number (1-10),
                "feedback": "string (concise)",
                "suggestedAnswer": "string (query/explanation)",
                "nextQuestion": "string"
            }
            
            Start: Return a JSON object with "nextQuestion" containing the actual first question about the subject.
            `;
        } else if (type === "mock") {
            // Full Mock Interview Logic
            difficulty = "Easy";
            let stage = "Introduction";
            if (questionCount >= 2 && questionCount < 10) stage = "Project";
            if (questionCount >= 10 && questionCount < 20) stage = "Technical";
            if (questionCount >= 20) stage = "Behavioural";

            systemPrompt = `Expert Interviewer. Stage: ${stage}. Project: ${projectContext || "None"}.
            Flow: Intro(1-2) -> Project(3-10) -> Technical(11-20) -> Behavioural(21-25).
            Keep difficulty EASY.
            
            Response Format:
            {
                "rating": number (1-10),
                "feedback": "string (concise)",
                "suggestedAnswer": "string (brief)",
                "nextQuestion": "string"
            }
            
            Start: Return a JSON object with "nextQuestion" containing the intro question.
            `;
        } else if (type === "custom") {
            // Custom Topic
            difficulty = "Easy";
            systemPrompt = `Interviewer for topic: ${subject}.
            Goal: Ask relevant conceptual interview questions. Do NOT ask for code.
            
            Response Format:
            {
                "nextQuestion": "string"
            }
            
            Start: Return a JSON object with "nextQuestion" containing the actual first question.
            `;
        } else {
            // Behavioural (Default)
            if (questionCount > 5 && questionCount <= 10) difficulty = "Easy";
            if (questionCount > 10) difficulty = "Medium";

            systemPrompt = `HR Interviewer. Goal: Assess soft skills (STAR method).
            
            Response Format:
            {
                "rating": number (1-10),
                "feedback": "string (concise)",
                "suggestedAnswer": "string (brief)",
                "nextQuestion": "string"
            }
            
            Start: Return a JSON object with "nextQuestion" containing the intro question.
            `;
        }

        const DYNAMIC_SYSTEM_PROMPT = `${systemPrompt}
        
        Current Question Number: ${questionCount + 1}
        Current Difficulty Level: ${difficulty}
        
        IMPORTANT: STRICTLY maintain the "${difficulty}" difficulty level. Do NOT make questions easier or harder.
        IMPORTANT: Your questions must be STRICTLY related to the topic: ${subject}. Do NOT ask unrelated questions.
        IMPORTANT: Keep your questions SHORT and CONCISE.
        IMPORTANT: Ask ONE concept at a time. Do NOT combine multiple concepts in a single question.
        CRITICAL: You MUST return your response in a valid JSON string format.
        `;

        // If it's the start of the interview
        if (!userResponse) {
            let firstUserMessage = "Start the interview.";
            if (type === "project") firstUserMessage = "Start the interview. Ask the first question about my project.";
            if (type === "core") firstUserMessage = `Start the interview. Ask the first basic question about ${subject} (Very Easy).`;
            if (type === "dsa") firstUserMessage = `Start the interview. Ask the first basic question about ${subject} (Very Easy).`;
            if (type === "sql") firstUserMessage = `Start the interview. Ask the first basic question about ${subject} (Very Easy).`;
            if (type === "custom") firstUserMessage = `Start the interview. Ask the first question about ${subject}.`;
            if (type === "mock") firstUserMessage = "Start the interview. Ask me to introduce myself.";
            if (!type) firstUserMessage = "Start the interview. Introduce yourself briefly and ask the first behavioural question (Very Easy).";

            const completion = await openai.chat.completions.create({
                model: "gpt-5-nano",
                messages: [
                    { role: "system", content: DYNAMIC_SYSTEM_PROMPT },
                    { role: "user", content: firstUserMessage }
                ],
                response_format: { type: "json_object" },
            });

            let content = completion.choices[0].message.content || "{}";
            content = content.replace(/```json\n?|```/g, "").trim();

            try {
                const response = JSON.parse(content);
                return NextResponse.json(response);
            } catch (parseError) {
                return NextResponse.json(
                    { error: "Failed to parse AI response" },
                    { status: 500 }
                );
            }
        }

        // Evaluate user response
        const completion = await openai.chat.completions.create({
            model: "gpt-5-nano",
            messages: [
                { role: "system", content: DYNAMIC_SYSTEM_PROMPT },
                ...messages
            ],
            response_format: { type: "json_object" },
        });

        let content = completion.choices[0].message.content || "{}";
        content = content.replace(/```json\n?|```/g, "").trim();

        try {
            const response = JSON.parse(content);
            return NextResponse.json(response);
        } catch (parseError) {
            return NextResponse.json(
                { error: "Failed to parse AI response" },
                { status: 500 }
            );
        }

    } catch (error: any) {
        let errorMessage = "Failed to process interview request";
        if (error.code === 'insufficient_quota') {
            errorMessage = "OpenAI API Quota Exceeded. Please check your billing details and credit balance.";
        } else if (error.status === 429) {
            errorMessage = "Too many requests. Please try again later.";
        } else if (error.message) {
            errorMessage = error.message;
        }

        return NextResponse.json(
            { error: errorMessage },
            { status: error.status || 500 }
        );
    }
}
