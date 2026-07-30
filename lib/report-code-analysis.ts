import OpenAI from "openai";
import type { RecentCode } from "@/lib/report-data";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-build" });

export interface CodeReview {
    problemTitle: string;
    language: string;
    status: string;
    submittedAt: string;
    studentCode: string;      // the exact code the student wrote (from the DB, not the model)
    efficiencyScore: number;  // 0-10
    timeComplexity: string;   // e.g. "O(n^2)"
    spaceComplexity: string;  // e.g. "O(n)"
    assessment: string;       // what is good / what is inefficient
    optimizedCode: string;    // the most efficient correct version
    optimizedComplexity: string; // complexity of the optimized version
}

export interface CodeEfficiencyReport {
    overallCommentary: string;
    reviews: CodeReview[];
    isFallback: boolean;
}

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n) + "\n…[truncated]" : s);
const MAX_CODE_CHARS = 1500;

function fallback(recentCodes: RecentCode[], reason: string): CodeEfficiencyReport {
    return {
        overallCommentary:
            reason === "no-data"
                ? "This student has not submitted any code on the platform yet, so a code-efficiency review is not available."
                : "An automated code-efficiency review could not be generated at this time. The student's most recent submissions are listed below without optimization notes.",
        // Still surface the student's actual code even when the AI is unavailable.
        reviews: recentCodes.map((c) => ({
            problemTitle: c.problemTitle,
            language: c.language,
            status: c.status,
            submittedAt: c.submittedAt,
            studentCode: c.code,
            efficiencyScore: 0,
            timeComplexity: "—",
            spaceComplexity: "—",
            assessment: "",
            optimizedCode: "",
            optimizedComplexity: "—",
        })),
        isFallback: true,
    };
}

export async function generateCodeEfficiencyReport(recentCodes: RecentCode[]): Promise<CodeEfficiencyReport> {
    if (!recentCodes.length) return fallback(recentCodes, "no-data");

    const items = recentCodes.map((c, i) => ({
        index: i,
        problemTitle: c.problemTitle,
        language: c.language,
        status: c.status,
        code: clip(c.code, MAX_CODE_CHARS),
    }));

    const system = `You are a senior software engineer reviewing a student's code for a placement evaluation report. For EACH submission you receive, judge how efficiently it is written and provide the most efficient correct version.

Return a JSON object with EXACTLY this shape:
{
  "overallCommentary": "2-3 sentences on the student's overall coding style, efficiency habits, and how optimal their code tends to be",
  "reviews": [
    {
      "index": <the integer index of the submission>,
      "efficiencyScore": <0-10 number, 10 = already optimal>,
      "timeComplexity": "Big-O of the STUDENT'S code, e.g. O(n^2)",
      "spaceComplexity": "Big-O space of the STUDENT'S code",
      "assessment": "1-3 sentences: what is done well and what is inefficient or non-idiomatic",
      "optimizedCode": "the most efficient correct solution in the SAME language; if the student's code is already optimal, return a clean idiomatic version",
      "optimizedComplexity": "Big-O of your optimized solution, e.g. O(n)"
    }
  ]
}

Rules:
- Include one review object for EVERY submission index provided.
- Be accurate about complexity — analyse the actual code, do not guess.
- optimizedCode must be complete, correct, runnable code. Do NOT wrap it in markdown code fences inside the JSON string.
- Keep the same programming language as the student's submission.
- If a submission is incomplete or non-functional, say so in assessment and still give the correct optimal solution.
- Return ONLY the JSON object.`;

    const user = `Review these ${items.length} code submissions:\n\n${items
        .map(
            (it) =>
                `----- SUBMISSION index=${it.index} -----\nProblem: ${it.problemTitle}\nLanguage: ${it.language}\nResult: ${it.status}\nCode:\n${it.code}`
        )
        .join("\n\n")}`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: system },
                { role: "user", content: user },
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
        });

        let content = completion.choices[0].message.content || "{}";
        content = content.replace(/```json\n?|```/g, "").trim();
        const parsed = JSON.parse(content);

        const byIndex = new Map<number, any>();
        if (Array.isArray(parsed.reviews)) {
            for (const r of parsed.reviews) {
                const idx = Number(r?.index);
                if (Number.isInteger(idx)) byIndex.set(idx, r);
            }
        }

        // Merge AI review onto each real submission by index, so the student's actual code
        // is always preserved verbatim regardless of what the model returned.
        const reviews: CodeReview[] = recentCodes.map((c, i) => {
            const r = byIndex.get(i);
            return {
                problemTitle: c.problemTitle,
                language: c.language,
                status: c.status,
                submittedAt: c.submittedAt,
                studentCode: c.code,
                efficiencyScore: r ? Math.max(0, Math.min(10, Math.round(Number(r.efficiencyScore) || 0))) : 0,
                timeComplexity: r && typeof r.timeComplexity === "string" ? r.timeComplexity : "—",
                spaceComplexity: r && typeof r.spaceComplexity === "string" ? r.spaceComplexity : "—",
                assessment: r && typeof r.assessment === "string" ? r.assessment : "",
                optimizedCode: r && typeof r.optimizedCode === "string" ? r.optimizedCode : "",
                optimizedComplexity: r && typeof r.optimizedComplexity === "string" ? r.optimizedComplexity : "—",
            };
        });

        return {
            overallCommentary: typeof parsed.overallCommentary === "string" ? parsed.overallCommentary : "",
            reviews,
            isFallback: false,
        };
    } catch (err) {
        console.error("Code efficiency analysis failed:", err);
        return fallback(recentCodes, "error");
    }
}
