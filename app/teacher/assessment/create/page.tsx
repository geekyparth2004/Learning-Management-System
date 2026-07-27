"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, CheckSquare, Code, Mic, Loader2 } from "lucide-react";
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

type RoundType = "mcq" | "coding" | "voice";

interface MCQConfig { role: string; level: number; questionCount: number; }
interface CodingConfig { level: number; problemCount: number; }
interface VoiceConfig { topic: string; questionCount: number; level: number; }

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

    // Coding config
    const [codingLevel, setCodingLevel] = useState(5);
    const [codingCount, setCodingCount] = useState(3);

    // Voice config
    const [voiceTopic, setVoiceTopic] = useState("");
    const [voiceCount, setVoiceCount] = useState(10);
    const [voiceLevel, setVoiceLevel] = useState(5);

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

        // Build rounds config
        const rounds: any[] = [];
        if (selectedRounds.has("mcq")) {
            rounds.push({ type: "mcq", role: mcqRole, level: mcqLevel, questionCount: mcqCount });
        }
        if (selectedRounds.has("coding")) {
            rounds.push({ type: "coding", level: codingLevel, problemCount: codingCount });
        }
        if (selectedRounds.has("voice")) {
            rounds.push({ type: "voice", topic: voiceTopic, questionCount: voiceCount, level: voiceLevel });
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

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">
                                                Difficulty Level: <span className="text-pink-400 font-bold">{mcqLevel}</span>
                                                <span className="text-gray-500 ml-1">({levelLabels[mcqLevel]})</span>
                                            </label>
                                            <input type="range" min={1} max={10} value={mcqLevel} onChange={e => setMcqLevel(Number(e.target.value))}
                                                className="w-full accent-pink-500" />
                                        </div>
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

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">
                                                Difficulty Level: <span className="text-blue-400 font-bold">{codingLevel}</span>
                                                <span className="text-gray-500 ml-1">({levelLabels[codingLevel]})</span>
                                            </label>
                                            <input type="range" min={1} max={10} value={codingLevel} onChange={e => setCodingLevel(Number(e.target.value))}
                                                className="w-full accent-blue-500" />
                                            <p className="text-xs text-gray-500">AI generates coding problems matching this difficulty.</p>
                                        </div>
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

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">
                                                Difficulty Level: <span className="text-green-400 font-bold">{voiceLevel}</span>
                                                <span className="text-gray-500 ml-1">({levelLabels[voiceLevel]})</span>
                                            </label>
                                            <input type="range" min={1} max={10} value={voiceLevel} onChange={e => setVoiceLevel(Number(e.target.value))}
                                                className="w-full accent-green-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">Number of Questions</label>
                                            <input type="number" min={3} max={20} value={voiceCount} onChange={e => setVoiceCount(Number(e.target.value))} className={inputClass} />
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
