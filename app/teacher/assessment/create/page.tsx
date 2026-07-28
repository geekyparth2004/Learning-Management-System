"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, CheckSquare, Code, Mic, Loader2, TrendingUp, SlidersHorizontal, Bug, Terminal, Database, Mail } from "lucide-react";
import Link from "next/link";

const ROLES = [
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

type RoundType = "mcq" | "coding" | "voice" | "debug" | "output" | "sql" | "email";

// Difficulty mode for a round: a teacher-fixed level, or adaptive (starts at level 1
// and moves up on a correct answer / down on a wrong one).
type DifficultyMode = "fixed" | "adaptive";

export default function CreateAssessmentPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Basic info
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [duration, setDuration] = useState("");

    // Round selection
    const [selectedRounds, setSelectedRounds] = useState<Set<RoundType>>(new Set());

    // MCQ config
    const [mcqRole, setMcqRole] = useState(ROLES[0]);
    const [mcqLevel, setMcqLevel] = useState(5);
    const [mcqCount, setMcqCount] = useState(10);
    const [mcqMode, setMcqMode] = useState<DifficultyMode>("fixed");

    // Coding config
    const [codingLevel, setCodingLevel] = useState(5);
    const [codingCount, setCodingCount] = useState(3);
    const [codingMode, setCodingMode] = useState<DifficultyMode>("fixed");

    // Voice config
    const [voiceTopic, setVoiceTopic] = useState("");
    const [voiceCount, setVoiceCount] = useState(10);
    const [voiceLevel, setVoiceLevel] = useState(5);
    const [voiceMode, setVoiceMode] = useState<DifficultyMode>("fixed");

    // Debug challenge config
    const [debugLevel, setDebugLevel] = useState(5);
    const [debugCount, setDebugCount] = useState(3);
    const [debugLanguage, setDebugLanguage] = useState<"python" | "java" | "cpp">("python");

    // Output prediction config
    const [outputLevel, setOutputLevel] = useState(5);
    const [outputCount, setOutputCount] = useState(5);

    // SQL config
    const [sqlLevel, setSqlLevel] = useState(5);
    const [sqlCount, setSqlCount] = useState(3);

    // Email writing config
    const [emailLevel, setEmailLevel] = useState(5);
    const [emailCount, setEmailCount] = useState(3);

    function toggleRound(round: RoundType) {
        setSelectedRounds(prev => {
            const next = new Set(prev);
            if (next.has(round)) next.delete(round);
            else next.add(round);
            return next;
        });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (selectedRounds.size === 0) {
            alert("Please select at least one assessment round type.");
            return;
        }
        if (!title || !startTime || !endTime) {
            alert("Please fill in all required fields.");
            return;
        }

        setLoading(true);

        // Build rounds config. Adaptive rounds always start at level 1, so the teacher's
        // level slider does not apply to them.
        const rounds: any[] = [];
        if (selectedRounds.has("mcq")) {
            rounds.push({
                type: "mcq",
                role: mcqRole,
                questionCount: mcqCount,
                ...(mcqMode === "adaptive" ? { adaptive: true } : { level: mcqLevel }),
            });
        }
        if (selectedRounds.has("coding")) {
            rounds.push({
                type: "coding",
                problemCount: codingCount,
                ...(codingMode === "adaptive" ? { adaptive: true } : { level: codingLevel }),
            });
        }
        if (selectedRounds.has("voice")) {
            rounds.push({
                type: "voice",
                topic: voiceTopic,
                questionCount: voiceCount,
                ...(voiceMode === "adaptive" ? { adaptive: true } : { level: voiceLevel }),
            });
        }
        if (selectedRounds.has("debug")) {
            rounds.push({
                type: "debug",
                level: debugLevel,
                challengeCount: debugCount,
                language: debugLanguage,
            });
        }
        if (selectedRounds.has("output")) {
            rounds.push({
                type: "output",
                level: outputLevel,
                questionCount: outputCount,
            });
        }
        if (selectedRounds.has("sql")) {
            rounds.push({
                type: "sql",
                level: sqlLevel,
                questionCount: sqlCount,
            });
        }
        if (selectedRounds.has("email")) {
            rounds.push({
                type: "email",
                level: emailLevel,
                questionCount: emailCount,
            });
        }

        const configJson = JSON.stringify({ rounds, description });

        const data = {
            title,
            description: configJson,
            type: "INTERNAL",
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(endTime).toISOString(),
            duration: duration ? parseInt(duration) : null,
            category: "ASSESSMENT",
        };

        try {
            const res = await fetch("/api/contest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                router.push("/teacher/assessment");
                router.refresh();
            } else {
                alert("Failed to create assessment");
            }
        } catch (error) {
            console.error(error);
            alert("Error creating assessment");
        } finally {
            setLoading(false);
        }
    }

    const levelLabels: Record<number, string> = {
        1: "Beginner", 2: "Beginner+", 3: "Elementary", 4: "Elementary+", 5: "Intermediate",
        6: "Intermediate+", 7: "Advanced", 8: "Advanced+", 9: "Expert", 10: "Master",
    };

    const inputClass = "w-full rounded-lg border border-gray-800 bg-[#111111] px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none transition-colors";

    return (
        <div className="min-h-screen bg-[#0e0e0e] text-white p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                <Link href="/teacher/assessment" className="mb-6 flex items-center gap-2 text-sm text-gray-400 hover:text-white">
                    <ArrowLeft className="h-4 w-4" /> Back to Assessments
                </Link>

                <h1 className="mb-2 text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
                    Create New Assessment
                </h1>
                <p className="mb-8 text-gray-400">Configure AI-powered assessment rounds for your students.</p>

                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* ── Basic Info ── */}
                    <div className="rounded-xl border border-gray-800 bg-[#161616] p-6 space-y-5">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold">1</span>
                            Basic Information
                        </h2>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Assessment Title *</label>
                            <input value={title} onChange={e => setTitle(e.target.value)} required className={inputClass} placeholder="e.g. SDE Midterm Assessment" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Description (optional)</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} className={inputClass} placeholder="Brief description visible to students..." rows={2} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Start Time *</label>
                                <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} required className={`${inputClass} [color-scheme:dark]`} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">End Time *</label>
                                <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} required className={`${inputClass} [color-scheme:dark]`} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Duration (min)</label>
                                <input type="number" value={duration} onChange={e => setDuration(e.target.value)} className={inputClass} placeholder="e.g. 120" />
                            </div>
                        </div>
                    </div>

                    {/* ── Round Selection ── */}
                    <div className="rounded-xl border border-gray-800 bg-[#161616] p-6 space-y-5">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-600 text-xs font-bold">2</span>
                            Select Round Types
                        </h2>
                        <p className="text-sm text-gray-400">Pick one or more round types. Students will complete them in order.</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* MCQ */}
                            <button type="button" onClick={() => toggleRound("mcq")}
                                className={`group flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all ${
                                    selectedRounds.has("mcq")
                                        ? "border-pink-500 bg-pink-500/10 shadow-[0_0_20px_rgba(236,72,153,0.15)]"
                                        : "border-gray-800 bg-[#111111] hover:border-gray-600"
                                }`}
                            >
                                <div className={`rounded-full p-3 transition-colors ${selectedRounds.has("mcq") ? "bg-pink-500/20 text-pink-400" : "bg-gray-800 text-gray-400"}`}>
                                    <CheckSquare className="h-7 w-7" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">MCQ Round</h3>
                                    <p className="text-xs text-gray-400 mt-1">AI-generated multiple choice questions</p>
                                </div>
                            </button>

                            {/* Coding */}
                            <button type="button" onClick={() => toggleRound("coding")}
                                className={`group flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all ${
                                    selectedRounds.has("coding")
                                        ? "border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                                        : "border-gray-800 bg-[#111111] hover:border-gray-600"
                                }`}
                            >
                                <div className={`rounded-full p-3 transition-colors ${selectedRounds.has("coding") ? "bg-blue-500/20 text-blue-400" : "bg-gray-800 text-gray-400"}`}>
                                    <Code className="h-7 w-7" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">Coding Round</h3>
                                    <p className="text-xs text-gray-400 mt-1">AI-generated coding problems with test cases</p>
                                </div>
                            </button>

                            {/* Voice */}
                            <button type="button" onClick={() => toggleRound("voice")}
                                className={`group flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all ${
                                    selectedRounds.has("voice")
                                        ? "border-green-500 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.15)]"
                                        : "border-gray-800 bg-[#111111] hover:border-gray-600"
                                }`}
                            >
                                <div className={`rounded-full p-3 transition-colors ${selectedRounds.has("voice") ? "bg-green-500/20 text-green-400" : "bg-gray-800 text-gray-400"}`}>
                                    <Mic className="h-7 w-7" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">Voice Round</h3>
                                    <p className="text-xs text-gray-400 mt-1">AI voice interview with verbal answers</p>
                                </div>
                            </button>

                            {/* Debug Challenge */}
                            <button type="button" onClick={() => toggleRound("debug")}
                                className={`group flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all ${
                                    selectedRounds.has("debug")
                                        ? "border-orange-500 bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.15)]"
                                        : "border-gray-800 bg-[#111111] hover:border-gray-600"
                                }`}
                            >
                                <div className={`rounded-full p-3 transition-colors ${selectedRounds.has("debug") ? "bg-orange-500/20 text-orange-400" : "bg-gray-800 text-gray-400"}`}>
                                    <Bug className="h-7 w-7" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">Debug Challenge</h3>
                                    <p className="text-xs text-gray-400 mt-1">Fix buggy code until all tests pass</p>
                                </div>
                            </button>

                            {/* Output Prediction */}
                            <button type="button" onClick={() => toggleRound("output")}
                                className={`group flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all ${
                                    selectedRounds.has("output")
                                        ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                                        : "border-gray-800 bg-[#111111] hover:border-gray-600"
                                }`}
                            >
                                <div className={`rounded-full p-3 transition-colors ${selectedRounds.has("output") ? "bg-cyan-500/20 text-cyan-400" : "bg-gray-800 text-gray-400"}`}>
                                    <Terminal className="h-7 w-7" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">Output Prediction</h3>
                                    <p className="text-xs text-gray-400 mt-1">Predict what a code snippet prints</p>
                                </div>
                            </button>

                            {/* SQL */}
                            <button type="button" onClick={() => toggleRound("sql")}
                                className={`group flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all ${
                                    selectedRounds.has("sql")
                                        ? "border-violet-500 bg-violet-500/10 shadow-[0_0_20px_rgba(139,92,246,0.15)]"
                                        : "border-gray-800 bg-[#111111] hover:border-gray-600"
                                }`}
                            >
                                <div className={`rounded-full p-3 transition-colors ${selectedRounds.has("sql") ? "bg-violet-500/20 text-violet-400" : "bg-gray-800 text-gray-400"}`}>
                                    <Database className="h-7 w-7" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">SQL Round</h3>
                                    <p className="text-xs text-gray-400 mt-1">Write queries tested against real data</p>
                                </div>
                            </button>

                            {/* Email Writing */}
                            <button type="button" onClick={() => toggleRound("email")}
                                className={`group flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all ${
                                    selectedRounds.has("email")
                                        ? "border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                                        : "border-gray-800 bg-[#111111] hover:border-gray-600"
                                }`}
                            >
                                <div className={`rounded-full p-3 transition-colors ${selectedRounds.has("email") ? "bg-amber-500/20 text-amber-400" : "bg-gray-800 text-gray-400"}`}>
                                    <Mail className="h-7 w-7" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">Email Writing</h3>
                                    <p className="text-xs text-gray-400 mt-1">AI grades grammar &amp; professionalism</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* ── Round Configs ── */}
                    {selectedRounds.size > 0 && (
                        <div className="rounded-xl border border-gray-800 bg-[#161616] p-6 space-y-6">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-xs font-bold">3</span>
                                Configure Rounds
                            </h2>

                            {/* MCQ Config */}
                            {selectedRounds.has("mcq") && (
                                <div className="rounded-lg border border-pink-500/30 bg-pink-500/5 p-5 space-y-4">
                                    <h3 className="font-bold text-pink-400 flex items-center gap-2">
                                        <CheckSquare className="h-4 w-4" /> MCQ Round Configuration
                                    </h3>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Target Role</label>
                                        <select value={mcqRole} onChange={e => setMcqRole(e.target.value)} className={inputClass}>
                                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                        <p className="text-xs text-gray-500">AI will generate MCQs relevant to this job role.</p>
                                    </div>

                                    <ModeSelector mode={mcqMode} onChange={setMcqMode} accent="pink"
                                        adaptiveHint="Starts at Level 1. Each correct answer makes the next question harder, each wrong answer makes it easier." />

                                    <div className="grid grid-cols-2 gap-4">
                                        {mcqMode === "fixed" ? (
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-300">
                                                    Difficulty Level: <span className="text-pink-400 font-bold">{mcqLevel}</span>
                                                    <span className="text-gray-500 ml-1">({levelLabels[mcqLevel]})</span>
                                                </label>
                                                <input type="range" min={1} max={10} value={mcqLevel} onChange={e => setMcqLevel(Number(e.target.value))}
                                                    className="w-full accent-pink-500" />
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-300">Starting Level</label>
                                                <p className="text-sm text-pink-400 font-bold">Level 1 ({levelLabels[1]})</p>
                                                <p className="text-xs text-gray-500">Difficulty adjusts automatically per answer.</p>
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">Number of Questions</label>
                                            <input type="number" min={5} max={50} value={mcqCount} onChange={e => setMcqCount(Number(e.target.value))} className={inputClass} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Coding Config */}
                            {selectedRounds.has("coding") && (
                                <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-5 space-y-4">
                                    <h3 className="font-bold text-blue-400 flex items-center gap-2">
                                        <Code className="h-4 w-4" /> Coding Round Configuration
                                    </h3>

                                    <ModeSelector mode={codingMode} onChange={setCodingMode} accent="blue"
                                        adaptiveHint="Starts at Level 1. Solving all test cases makes the next problem harder, failing any makes it easier." />

                                    <div className="grid grid-cols-2 gap-4">
                                        {codingMode === "fixed" ? (
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-300">
                                                    Difficulty Level: <span className="text-blue-400 font-bold">{codingLevel}</span>
                                                    <span className="text-gray-500 ml-1">({levelLabels[codingLevel]})</span>
                                                </label>
                                                <input type="range" min={1} max={10} value={codingLevel} onChange={e => setCodingLevel(Number(e.target.value))}
                                                    className="w-full accent-blue-500" />
                                                <p className="text-xs text-gray-500">AI generates coding problems matching this difficulty.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-300">Starting Level</label>
                                                <p className="text-sm text-blue-400 font-bold">Level 1 ({levelLabels[1]})</p>
                                                <p className="text-xs text-gray-500">Problems are served one at a time, difficulty adjusts per problem.</p>
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">Number of Problems</label>
                                            <input type="number" min={1} max={10} value={codingCount} onChange={e => setCodingCount(Number(e.target.value))} className={inputClass} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Voice Config */}
                            {selectedRounds.has("voice") && (
                                <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-5 space-y-4">
                                    <h3 className="font-bold text-green-400 flex items-center gap-2">
                                        <Mic className="h-4 w-4" /> Voice Round Configuration
                                    </h3>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Interview Topic *</label>
                                        <input value={voiceTopic} onChange={e => setVoiceTopic(e.target.value)} className={inputClass}
                                            placeholder="e.g. React Hooks, System Design, OOP Concepts" required={selectedRounds.has("voice")} />
                                        <p className="text-xs text-gray-500">AI will ask verbal questions on this topic.</p>
                                    </div>

                                    <ModeSelector mode={voiceMode} onChange={setVoiceMode} accent="green"
                                        adaptiveHint="Starts at Level 1. Scoring 3+ of 5 on an answer makes the next question harder, below that makes it easier." />

                                    <div className="grid grid-cols-2 gap-4">
                                        {voiceMode === "fixed" ? (
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-300">
                                                    Difficulty Level: <span className="text-green-400 font-bold">{voiceLevel}</span>
                                                    <span className="text-gray-500 ml-1">({levelLabels[voiceLevel]})</span>
                                                </label>
                                                <input type="range" min={1} max={10} value={voiceLevel} onChange={e => setVoiceLevel(Number(e.target.value))}
                                                    className="w-full accent-green-500" />
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-300">Starting Level</label>
                                                <p className="text-sm text-green-400 font-bold">Level 1 ({levelLabels[1]})</p>
                                                <p className="text-xs text-gray-500">Difficulty adjusts based on the AI marks for each answer.</p>
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">Number of Questions</label>
                                            <input type="number" min={3} max={20} value={voiceCount} onChange={e => setVoiceCount(Number(e.target.value))} className={inputClass} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Debug Challenge Config */}
                            {selectedRounds.has("debug") && (
                                <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-5 space-y-4">
                                    <h3 className="font-bold text-orange-400 flex items-center gap-2">
                                        <Bug className="h-4 w-4" /> Debug Challenge Configuration
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        AI writes programs with planted bugs — low levels get syntax errors, mid levels logical errors,
                                        high levels both. Students fix the code and must pass all test cases. +5 marks per fixed program.
                                    </p>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">
                                                Difficulty Level: <span className="text-orange-400 font-bold">{debugLevel}</span>
                                                <span className="text-gray-500 ml-1">({levelLabels[debugLevel]})</span>
                                            </label>
                                            <input type="range" min={1} max={10} value={debugLevel} onChange={e => setDebugLevel(Number(e.target.value))}
                                                className="w-full accent-orange-500" />
                                            <p className="text-xs text-gray-500">
                                                1-3: syntax errors • 4-6: logical errors • 7-8: both • 9-10: multiple subtle bugs
                                            </p>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-300">Number of Challenges</label>
                                                <input type="number" min={1} max={10} value={debugCount} onChange={e => setDebugCount(Number(e.target.value))} className={inputClass} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-300">Language</label>
                                                <select value={debugLanguage} onChange={e => setDebugLanguage(e.target.value as any)} className={inputClass}>
                                                    <option value="python">Python</option>
                                                    <option value="java">Java</option>
                                                    <option value="cpp">C++</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Output Prediction Config */}
                            {selectedRounds.has("output") && (
                                <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-5 space-y-4">
                                    <h3 className="font-bold text-cyan-400 flex items-center gap-2">
                                        <Terminal className="h-4 w-4" /> Output Prediction Configuration
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        AI generates code or pseudocode snippets; students type the exact output they predict.
                                        +5 marks per correct prediction.
                                    </p>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">
                                                Difficulty Level: <span className="text-cyan-400 font-bold">{outputLevel}</span>
                                                <span className="text-gray-500 ml-1">({levelLabels[outputLevel]})</span>
                                            </label>
                                            <input type="range" min={1} max={10} value={outputLevel} onChange={e => setOutputLevel(Number(e.target.value))}
                                                className="w-full accent-cyan-500" />
                                            <p className="text-xs text-gray-500">Higher levels use trickier language semantics.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">Number of Questions</label>
                                            <input type="number" min={3} max={20} value={outputCount} onChange={e => setOutputCount(Number(e.target.value))} className={inputClass} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SQL Config */}
                            {selectedRounds.has("sql") && (
                                <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-5 space-y-4">
                                    <h3 className="font-bold text-violet-400 flex items-center gap-2">
                                        <Database className="h-4 w-4" /> SQL Round Configuration
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        AI generates SQL questions with sample data and visible + hidden test cases. Students write
                                        queries and run them against a real in-memory database. +3 marks per passed test case.
                                    </p>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">
                                                Difficulty Level: <span className="text-violet-400 font-bold">{sqlLevel}</span>
                                                <span className="text-gray-500 ml-1">({levelLabels[sqlLevel]})</span>
                                            </label>
                                            <input type="range" min={1} max={10} value={sqlLevel} onChange={e => setSqlLevel(Number(e.target.value))}
                                                className="w-full accent-violet-500" />
                                            <p className="text-xs text-gray-500">
                                                1-3: simple SELECT/WHERE • 4-7: JOINs &amp; GROUP BY • 8-10: subqueries &amp; advanced logic
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">Number of Questions</label>
                                            <input type="number" min={1} max={10} value={sqlCount} onChange={e => setSqlCount(Number(e.target.value))} className={inputClass} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Email Writing Config */}
                            {selectedRounds.has("email") && (
                                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-5 space-y-4">
                                    <h3 className="font-bold text-amber-400 flex items-center gap-2">
                                        <Mail className="h-4 w-4" /> Email Writing Configuration
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        AI gives each student a workplace email scenario. They write the email; AI grades it out of 10,
                                        deducting for grammar mistakes and unprofessional tone.
                                    </p>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">
                                                Difficulty Level: <span className="text-amber-400 font-bold">{emailLevel}</span>
                                                <span className="text-gray-500 ml-1">({levelLabels[emailLevel]})</span>
                                            </label>
                                            <input type="range" min={1} max={10} value={emailLevel} onChange={e => setEmailLevel(Number(e.target.value))}
                                                className="w-full accent-amber-500" />
                                            <p className="text-xs text-gray-500">
                                                1-3: everyday emails • 4-7: workplace nuance • 8-10: high-stakes communication
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">Number of Emails</label>
                                            <input type="number" min={1} max={10} value={emailCount} onChange={e => setEmailCount(Number(e.target.value))} className={inputClass} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Submit ── */}
                    <button type="submit" disabled={loading || selectedRounds.size === 0}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 py-3.5 font-bold text-white hover:from-pink-500 hover:to-purple-500 disabled:opacity-40 transition-all shadow-lg"
                    >
                        {loading ? (
                            <><Loader2 className="h-5 w-5 animate-spin" /> Creating Assessment...</>
                        ) : (
                            <><Save className="h-5 w-5" /> Create Assessment</>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

const ACCENTS: Record<string, { active: string; icon: string }> = {
    pink: { active: "border-pink-500 bg-pink-500/15 text-pink-300", icon: "text-pink-400" },
    blue: { active: "border-blue-500 bg-blue-500/15 text-blue-300", icon: "text-blue-400" },
    green: { active: "border-green-500 bg-green-500/15 text-green-300", icon: "text-green-400" },
};

function ModeSelector({ mode, onChange, accent, adaptiveHint }: {
    mode: DifficultyMode;
    onChange: (mode: DifficultyMode) => void;
    accent: "pink" | "blue" | "green";
    adaptiveHint: string;
}) {
    const styles = ACCENTS[accent];
    const inactive = "border-gray-800 bg-[#111111] text-gray-400 hover:border-gray-600";

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Difficulty Mode</label>
            <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => onChange("fixed")}
                    className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all ${mode === "fixed" ? styles.active : inactive}`}
                >
                    <SlidersHorizontal className={`h-5 w-5 shrink-0 ${mode === "fixed" ? styles.icon : "text-gray-500"}`} />
                    <div>
                        <p className="text-sm font-bold">Fixed Level</p>
                        <p className="text-[11px] opacity-70">Same difficulty throughout</p>
                    </div>
                </button>
                <button type="button" onClick={() => onChange("adaptive")}
                    className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all ${mode === "adaptive" ? styles.active : inactive}`}
                >
                    <TrendingUp className={`h-5 w-5 shrink-0 ${mode === "adaptive" ? styles.icon : "text-gray-500"}`} />
                    <div>
                        <p className="text-sm font-bold">Adaptive Mode</p>
                        <p className="text-[11px] opacity-70">Adjusts to the student</p>
                    </div>
                </button>
            </div>
            {mode === "adaptive" && (
                <p className="text-xs text-gray-500">{adaptiveHint}</p>
            )}
        </div>
    );
}
