import type { RoundType } from "./round-meta";
import type { AccentName } from "./builder-theme";

export const ROLES = [
    "Software Development Engineer",
    "Data Scientist",
    "Cybersecurity Analyst",
    "QA / Testing Engineer",
    "DevOps Engineer",
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Machine Learning Engineer",
    "Mobile App Developer",
];

/** A round is either at a teacher-fixed level, or adaptive (starts at level 1 and follows the student). */
export type DifficultyMode = "fixed" | "adaptive";

export interface RoundConfigState {
    level: number;
    /** Question / problem / challenge count — the field name differs per round in the payload. */
    count: number;
    mode: DifficultyMode;
    role?: string;
    topic?: string;
    language?: "python" | "java" | "cpp";
}

export interface RoundDef {
    type: RoundType;
    accent: AccentName;
    /** Copy for the round-selection tile. Label/icon come from ROUND_META. */
    tileDesc: string;
    configTitle: string;
    /** Grey explainer paragraph shown at the top of some config panels. */
    blurb?: string;
    supportsAdaptive: boolean;
    adaptiveHint?: string;
    /** Shown in place of the level slider when adaptive is selected. */
    adaptiveNote?: string;
    countLabel: string;
    countMin: number;
    countMax: number;
    /** Optional hint under the level slider. */
    levelHint?: string;
    defaults: RoundConfigState;
    /** Produces the entry pushed into the stored rounds[] array. */
    build: (c: RoundConfigState) => Record<string, unknown>;
    /** Human-readable config summary rows for the teacher/TPO detail page. */
    summary: (round: any) => { label: string; value: string }[];
}

/** Difficulty row shared by every round: adaptive rounds have no fixed level. */
function difficultyRow(round: any, label = "Difficulty") {
    return {
        label,
        value: round.adaptive ? "Adaptive (starts at Level 1)" : `Level ${round.level}/10`,
    };
}

/**
 * Single source of truth for the assessment rounds. Adding a round type means one entry
 * here plus a ROUND_META / ROUND_META_LIGHT pair — the tile grid, the payload builder and
 * the config panels all derive from this list.
 */
export const ROUND_DEFS: RoundDef[] = [
    {
        type: "mcq",
        accent: "pink",
        tileDesc: "AI-generated multiple choice questions",
        configTitle: "MCQ Round Configuration",
        supportsAdaptive: true,
        adaptiveHint: "Starts at Level 1. Each correct answer makes the next question harder, each wrong answer makes it easier.",
        adaptiveNote: "Difficulty adjusts automatically per answer.",
        countLabel: "Number of Questions",
        countMin: 5,
        countMax: 50,
        defaults: { role: ROLES[0], level: 5, count: 10, mode: "fixed" },
        build: (c) => ({
            type: "mcq",
            role: c.role,
            questionCount: c.count,
            ...(c.mode === "adaptive" ? { adaptive: true } : { level: c.level }),
        }),
        summary: (r) => [
            { label: "Role", value: String(r.role ?? "") },
            difficultyRow(r),
            { label: "Questions", value: String(r.questionCount || 10) },
        ],
    },
    {
        type: "coding",
        accent: "blue",
        tileDesc: "AI-generated coding problems with test cases",
        configTitle: "Coding Round Configuration",
        supportsAdaptive: true,
        adaptiveHint: "Starts at Level 1. Solving all test cases makes the next problem harder, failing any makes it easier.",
        adaptiveNote: "Problems are served one at a time, difficulty adjusts per problem.",
        levelHint: "AI generates coding problems matching this difficulty.",
        countLabel: "Number of Problems",
        countMin: 1,
        countMax: 10,
        defaults: { level: 5, count: 3, mode: "fixed" },
        build: (c) => ({
            type: "coding",
            problemCount: c.count,
            ...(c.mode === "adaptive" ? { adaptive: true } : { level: c.level }),
        }),
        summary: (r) => [
            difficultyRow(r),
            { label: "Problems", value: String(r.problemCount || 3) },
        ],
    },
    {
        type: "voice",
        accent: "green",
        tileDesc: "AI voice interview with verbal answers",
        configTitle: "Voice Round Configuration",
        supportsAdaptive: true,
        adaptiveHint: "Starts at Level 1. Scoring 3+ of 5 on an answer makes the next question harder, below that makes it easier.",
        adaptiveNote: "Difficulty adjusts based on the AI marks for each answer.",
        countLabel: "Number of Questions",
        countMin: 3,
        countMax: 20,
        defaults: { topic: "", level: 5, count: 10, mode: "fixed" },
        build: (c) => ({
            type: "voice",
            topic: c.topic,
            questionCount: c.count,
            ...(c.mode === "adaptive" ? { adaptive: true } : { level: c.level }),
        }),
        summary: (r) => [
            { label: "Topic", value: String(r.topic ?? "") },
            difficultyRow(r),
            { label: "Questions", value: String(r.questionCount || 10) },
        ],
    },
    {
        type: "debug",
        accent: "orange",
        tileDesc: "Fix buggy code until all tests pass",
        configTitle: "Debug Challenge Configuration",
        blurb: "AI writes programs with planted bugs — low levels get syntax errors, mid levels logical errors, high levels both. Students fix the code and must pass all test cases. +5 marks per fixed program.",
        supportsAdaptive: false,
        levelHint: "1-3: syntax errors • 4-6: logical errors • 7-8: both • 9-10: multiple subtle bugs",
        countLabel: "Number of Challenges",
        countMin: 1,
        countMax: 10,
        defaults: { level: 5, count: 3, mode: "fixed", language: "python" },
        build: (c) => ({
            type: "debug",
            level: c.level,
            challengeCount: c.count,
            language: c.language,
        }),
        summary: (r) => [
            { label: "Language", value: String(r.language || "python").toUpperCase() },
            { label: "Difficulty Level", value: `Level ${r.level}/10` },
            { label: "Challenges", value: String(r.challengeCount || 3) },
        ],
    },
    {
        type: "output",
        accent: "cyan",
        tileDesc: "Predict what a code snippet prints",
        configTitle: "Output Prediction Configuration",
        blurb: "AI generates code or pseudocode snippets; students type the exact output they predict. +5 marks per correct prediction.",
        supportsAdaptive: false,
        levelHint: "Higher levels use trickier language semantics.",
        countLabel: "Number of Questions",
        countMin: 3,
        countMax: 20,
        defaults: { level: 5, count: 5, mode: "fixed" },
        build: (c) => ({
            type: "output",
            level: c.level,
            questionCount: c.count,
        }),
        summary: (r) => [
            { label: "Difficulty Level", value: `Level ${r.level}/10` },
            { label: "Questions", value: String(r.questionCount || 5) },
        ],
    },
    {
        type: "sql",
        accent: "violet",
        tileDesc: "Write queries tested against real data",
        configTitle: "SQL Round Configuration",
        blurb: "AI generates SQL questions with sample data and visible + hidden test cases. Students write queries and run them against a real in-memory database. +3 marks per passed test case.",
        supportsAdaptive: false,
        levelHint: "1-3: simple SELECT/WHERE • 4-7: JOINs & GROUP BY • 8-10: subqueries & advanced logic",
        countLabel: "Number of Questions",
        countMin: 1,
        countMax: 10,
        defaults: { level: 5, count: 3, mode: "fixed" },
        build: (c) => ({
            type: "sql",
            level: c.level,
            questionCount: c.count,
        }),
        summary: (r) => [
            { label: "Difficulty Level", value: `Level ${r.level}/10` },
            { label: "Questions", value: String(r.questionCount || 3) },
            { label: "Marking", value: "+3 per passed test case" },
        ],
    },
    {
        type: "email",
        accent: "amber",
        tileDesc: "AI grades grammar & professionalism",
        configTitle: "Email Writing Configuration",
        blurb: "AI gives each student a workplace email scenario. They write the email; AI grades it out of 10, deducting for grammar mistakes and unprofessional tone.",
        supportsAdaptive: false,
        levelHint: "1-3: everyday emails • 4-7: workplace nuance • 8-10: high-stakes communication",
        countLabel: "Number of Emails",
        countMin: 1,
        countMax: 10,
        defaults: { level: 5, count: 3, mode: "fixed" },
        build: (c) => ({
            type: "email",
            level: c.level,
            questionCount: c.count,
        }),
        summary: (r) => [
            { label: "Difficulty Level", value: `Level ${r.level}/10` },
            { label: "Emails", value: String(r.questionCount || 3) },
            { label: "Marking", value: "Up to 10 per email (AI graded)" },
        ],
    },
    {
        type: "aptitude",
        accent: "teal",
        tileDesc: "Quantitative, logical & verbal MCQs",
        configTitle: "Aptitude Round Configuration",
        blurb: "AI generates aptitude MCQs across quantitative, logical reasoning, verbal ability and data interpretation. +1 mark per correct answer.",
        supportsAdaptive: true,
        adaptiveHint: "Starts at Level 1. Each correct answer makes the next question harder, each wrong answer makes it easier.",
        adaptiveNote: "Difficulty adjusts automatically per answer.",
        countLabel: "Number of Questions",
        countMin: 5,
        countMax: 50,
        defaults: { level: 5, count: 10, mode: "fixed" },
        build: (c) => ({
            type: "aptitude",
            questionCount: c.count,
            ...(c.mode === "adaptive" ? { adaptive: true } : { level: c.level }),
        }),
        summary: (r) => [
            difficultyRow(r),
            { label: "Questions", value: String(r.questionCount || 10) },
            { label: "Marking", value: "+1 per correct answer" },
        ],
    },
];

export const ROUND_DEF_BY_TYPE: Record<string, RoundDef> = Object.fromEntries(
    ROUND_DEFS.map((d) => [d.type, d])
);
