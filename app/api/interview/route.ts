import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert Technical Interviewer. Your goal is to conduct an interview, evaluate the candidate's responses, and ask follow-up questions.

When the user provides an answer:
1. Rate the answer on a scale of 1-10.
2. Provide specific feedback on technical accuracy and depth.
3. Provide a "Perfect Answer" example that would get a 10/10.
4. Ask the next relevant follow-up question or a new question.

Return your response in this JSON format:
{
    "rating": number,
    "feedback": "string",
    "suggestedAnswer": "string",
    "nextQuestion": "string"
}

If this is the start of the interview (no user answer provided), just return:
{
    "nextQuestion": "string (The first question to ask)"
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
                "nextQuestion": "string (The first question to ask)"
            }
            `;
        } else if (type === "core") {
            // Core Subject Interview Logic
            // User requested: Very Easy to Easy only
            if (questionCount <= 7) difficulty = "Very Easy";
            else difficulty = "Easy";

            systemPrompt = `You are a Computer Science Professor conducting an oral exam on ${subject}.
            
            Your goal is to ask conceptual questions to test the student's understanding of ${subject}.
            
            When the user provides an answer:
            1. Rate the answer on a scale of 1-10.
            2. Provide specific feedback on conceptual clarity and accuracy.
            3. Provide a "Perfect Answer" example that would get a 10/10.
            4. Ask the next relevant follow-up question or a new question about ${subject}.
            
            Return your response in this JSON format:
            {
                "rating": number,
                "feedback": "string",
                "suggestedAnswer": "string",
                "nextQuestion": "string"
            }
            
            If this is the start of the interview (no user answer provided), just return:
            {
                "nextQuestion": "string (The first question to ask)"
            }
            `;
        } else if (type === "dsa") {
            // DSA Interview Logic
            difficulty = "Easy"; // User requested fixed Easy difficulty

            systemPrompt = `You are a Technical Interviewer conducting a Data Structures & Algorithms interview focused on ${subject}.
            
            Your goal is to ask conceptual and logic-based questions about ${subject}. 
            DO NOT ask the user to write full code. Ask for their approach, time complexity, or logic.
            
            When the user provides an answer:
            1. Rate the answer on a scale of 1-10.
            2. Provide specific feedback on the algorithmic approach and efficiency.
            3. Provide a "Perfect Answer" example (logic/pseudocode) that would get a 10/10.
            4. Ask the next relevant follow-up question or a new question about ${subject}.
            
            Return your response in this JSON format:
            {
                "rating": number,
                "feedback": "string",
                "suggestedAnswer": "string",
                "nextQuestion": "string"
            }
            
            If this is the start of the interview (no user answer provided), just return:
            {
                "nextQuestion": "string (The first question to ask)"
            }
            `;
        } else if (type === "sql") {
            // SQL Interview Logic
            if (questionCount <= 5) difficulty = "Very Easy";
            else if (questionCount <= 10) difficulty = "Easy";
            else difficulty = "Medium";

            systemPrompt = `You are a Database Expert conducting a SQL interview focused on ${subject}.
            
            Your goal is to ask questions about SQL syntax, query logic, and database concepts related to ${subject}.
            You can ask the user to explain a query or predict the output of a scenario.
            
            When the user provides an answer:
            1. Rate the answer on a scale of 1-10.
            2. Provide specific feedback on the query logic and accuracy.
            3. Provide a "Perfect Answer" example (SQL query or explanation) that would get a 10/10.
            4. Ask the next relevant follow-up question or a new question about ${subject}.
            
            Return your response in this JSON format:
            {
                "rating": number,
                "feedback": "string",
                "suggestedAnswer": "string",
                "nextQuestion": "string"
            }
            
            If this is the start of the interview (no user answer provided), just return:
            {
                "nextQuestion": "string (The first question to ask)"
            }
            `;
        } else if (type === "mock") {
            // Full Mock Interview Logic (25 Questions)
            // Stages: Intro (1-2), Project (3-10), Technical (11-20), Behavioural (21-25)
            difficulty = "Easy"; // Overall Easy difficulty as requested

            let stage = "Introduction";
            if (questionCount >= 2 && questionCount < 10) stage = "Project Deep Dive";
            if (questionCount >= 10 && questionCount < 20) stage = "Technical Round (DSA/Core/SQL)";
            if (questionCount >= 20) stage = "Behavioural/HR";

            systemPrompt = `You are an Expert Interviewer conducting a comprehensive Full Mock Interview.
            Current Stage: ${stage}
            
            Candidate's Project Context: ${projectContext || "Not provided"}

            Your goal is to simulate a real interview flow.
            - Questions 1-2: Introduction & Ice breaking.
            - Questions 3-10: Deep dive into their project (Architecture, Challenges, Tech Stack).
            - Questions 11-20: Technical questions (Mix of DSA logic, Core CS concepts, SQL).
            - Questions 21-25: Behavioural & HR questions.

            IMPORTANT: 
            - Keep the difficulty EASY overall.
            - Pay attention to previous answers and ask relevant follow-up questions.
            - Maintain a professional but encouraging persona.
            
            When the user provides an answer:
            1. Rate the answer on a scale of 1-10.
            2. Provide specific feedback.
            3. Provide a "Perfect Answer" example.
            4. Ask the next relevant question based on the current stage.
            
            Return your response in this JSON format:
            {
                "rating": number,
                "feedback": "string",
                "suggestedAnswer": "string",
                "nextQuestion": "string"
            }
            
            If this is the start of the interview (no user answer provided), just return:
            {
                "nextQuestion": "string (The first question to ask - e.g., Tell me about yourself)"
            }
            `;
        } else {
            // Behavioural Interview Logic (Default)
            if (questionCount > 5 && questionCount <= 10) difficulty = "Easy";
            if (questionCount > 10) difficulty = "Medium";
        }

        const DYNAMIC_SYSTEM_PROMPT = `${systemPrompt}
        
        Current Question Number: ${questionCount + 1}
        Current Difficulty Level: ${difficulty}
        
        IMPORTANT: Adjust the complexity of your question to match the "${difficulty}" level.
        `;

        // If it's the start of the interview
        if (!userResponse) {
            let firstUserMessage = "Start the interview.";
            if (type === "project") firstUserMessage = "Start the interview. Ask the first question about my project.";
            if (type === "core") firstUserMessage = `Start the interview. Ask the first basic question about ${subject} (Very Easy).`;
            if (type === "dsa") firstUserMessage = `Start the interview. Ask the first basic question about ${subject} (Very Easy).`;
            if (type === "sql") firstUserMessage = `Start the interview. Ask the first basic question about ${subject} (Very Easy).`;
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
