"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, TrendingUp, SlidersHorizontal, Shield } from "lucide-react";
import { LEVEL_LABELS } from "@/lib/adaptive";
import { roundMeta, type RoundType } from "./round-meta";
import { BUILDER_CHROME, BUILDER_ACCENTS, type BuilderTheme, type AccentName } from "./builder-theme";
import { ROUND_DEFS, ROLES, type RoundConfigState, type DifficultyMode, type RoundDef } from "./round-defs";

export interface AssessmentBuilderFormProps {
    theme: BuilderTheme;
    /** POST target. Teacher: "/api/contest". TPO: "/api/coordinator/assessments". */
    endpoint: string;
    successRedirect: string;
    backHref: string;
    backLabel?: string;
    heading?: string;
    subheading?: string;
    /** Literal fields merged into the POST body (the TPO route forces these server-side instead). */
    extraPayload?: Record<string, unknown>;
    /** Optional banner explaining who will see the assessment. */
    scopeNotice?: string;
}

export default function AssessmentBuilderForm({
    theme,
    endpoint,
    successRedirect,
    backHref,
    backLabel = "Back to Assessments",
    heading = "Create New Assessment",
    subheading = "Configure AI-powered assessment rounds for your students.",
    extraPayload,
    scopeNotice,
}: AssessmentBuilderFormProps) {
    const router = useRouter();
    const chrome = BUILDER_CHROME[theme];
    const accents = BUILDER_ACCENTS[theme];
    const meta = roundMeta(theme);

    const [loading, setLoading] = useState(false);

    // Basic info
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [duration, setDuration] = useState("");

    const [selected, setSelected] = useState<Set<RoundType>>(new Set());
    const [cfg, setCfg] = useState<Record<string, RoundConfigState>>(() =>
        Object.fromEntries(ROUND_DEFS.map((d) => [d.type, { ...d.defaults }]))
    );

    const patch = (type: RoundType, p: Partial<RoundConfigState>) =>
        setCfg((prev) => ({ ...prev, [type]: { ...prev[type], ...p } }));

    function toggleRound(type: RoundType) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(type)) next.delete(type);
            else next.add(type);
            return next;
        });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (selected.size === 0) {
            alert("Please select at least one assessment round type.");
            return;
        }
        if (!title || !startTime || !endTime) {
            alert("Please fill in all required fields.");
            return;
        }

        setLoading(true);

        // Adaptive rounds always start at level 1, so the level slider does not apply to them —
        // each round's build() decides which of adaptive/level to emit.
        const rounds = ROUND_DEFS.filter((d) => selected.has(d.type)).map((d) => d.build(cfg[d.type]));

        const data = {
            title,
            description: JSON.stringify({ rounds, description }),
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(endTime).toISOString(),
            duration: duration ? parseInt(duration) : null,
            ...extraPayload,
        };

        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                router.push(successRedirect);
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

    return (
        <div className={chrome.page}>
            <div className="max-w-3xl mx-auto">
                <Link href={backHref} className={`mb-6 flex items-center gap-2 text-sm ${chrome.backLink}`}>
                    <ArrowLeft className="h-4 w-4" /> {backLabel}
                </Link>

                <h1 className={`mb-2 ${chrome.heading}`}>{heading}</h1>
                <p className={`mb-8 ${chrome.subheading}`}>{subheading}</p>

                {scopeNotice && (
                    <div className="mb-8 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                        <p className="text-sm text-blue-800">{scopeNotice}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* ── Basic Info ── */}
                    <div className={`${chrome.card} space-y-5`}>
                        <h2 className={`flex items-center gap-2 ${chrome.cardTitle}`}>
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">1</span>
                            Basic Information
                        </h2>

                        <div className="space-y-2">
                            <label className={chrome.label}>Assessment Title *</label>
                            <input value={title} onChange={(e) => setTitle(e.target.value)} required
                                className={chrome.input} placeholder="e.g. SDE Midterm Assessment" />
                        </div>

                        <div className="space-y-2">
                            <label className={chrome.label}>Description (optional)</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                                className={chrome.input} placeholder="Brief description visible to students..." rows={2} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className={chrome.label}>Start Time *</label>
                                <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required
                                    className={`${chrome.input} ${chrome.dateScheme}`} />
                            </div>
                            <div className="space-y-2">
                                <label className={chrome.label}>End Time *</label>
                                <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required
                                    className={`${chrome.input} ${chrome.dateScheme}`} />
                            </div>
                            <div className="space-y-2">
                                <label className={chrome.label}>Duration (min)</label>
                                <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)}
                                    className={chrome.input} placeholder="e.g. 120" />
                            </div>
                        </div>
                    </div>

                    {/* ── Round Selection ── */}
                    <div className={`${chrome.card} space-y-5`}>
                        <h2 className={`flex items-center gap-2 ${chrome.cardTitle}`}>
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">2</span>
                            Select Round Types
                        </h2>
                        <p className={`text-sm ${chrome.subheading}`}>Pick one or more round types. Students will complete them in order.</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {ROUND_DEFS.map((def) => {
                                const isOn = selected.has(def.type);
                                const accent = accents[def.accent];
                                const Icon = meta[def.type].icon;
                                return (
                                    <button key={def.type} type="button" onClick={() => toggleRound(def.type)}
                                        className={`group flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all ${
                                            isOn ? accent.tileActive : chrome.tileInactive
                                        }`}
                                    >
                                        <div className={`rounded-full p-3 transition-colors ${isOn ? accent.tileIconActive : chrome.tileIconInactive}`}>
                                            <Icon className="h-7 w-7" />
                                        </div>
                                        <div>
                                            <h3 className={chrome.tileTitle}>{meta[def.type].label}</h3>
                                            <p className={chrome.tileDesc}>{def.tileDesc}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Round Configs ── */}
                    {selected.size > 0 && (
                        <div className={`${chrome.card} space-y-6`}>
                            <h2 className={`flex items-center gap-2 ${chrome.cardTitle}`}>
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">3</span>
                                Configure Rounds
                            </h2>

                            {ROUND_DEFS.filter((d) => selected.has(d.type)).map((def) => (
                                <RoundConfigPanel
                                    key={def.type}
                                    def={def}
                                    theme={theme}
                                    state={cfg[def.type]}
                                    onPatch={(p) => patch(def.type, p)}
                                />
                            ))}
                        </div>
                    )}

                    {/* ── Submit ── */}
                    <button type="submit" disabled={loading || selected.size === 0}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold transition-all disabled:opacity-40 ${chrome.submit}`}
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

/** One round's configuration panel. Layout is shared; per-round extras are switched on def.type. */
function RoundConfigPanel({ def, theme, state, onPatch }: {
    def: RoundDef;
    theme: BuilderTheme;
    state: RoundConfigState;
    onPatch: (p: Partial<RoundConfigState>) => void;
}) {
    const chrome = BUILDER_CHROME[theme];
    const accent = BUILDER_ACCENTS[theme][def.accent];
    const meta = roundMeta(theme)[def.type];
    const Icon = meta.icon;
    const isAdaptive = def.supportsAdaptive && state.mode === "adaptive";

    return (
        <div className={`rounded-lg border p-5 space-y-4 ${accent.panel}`}>
            <h3 className={`font-bold flex items-center gap-2 ${accent.panelTitle}`}>
                <Icon className="h-4 w-4" /> {def.configTitle}
            </h3>

            {def.blurb && <p className={chrome.hint}>{def.blurb}</p>}

            {/* Role picker (MCQ only) */}
            {def.type === "mcq" && (
                <div className="space-y-2">
                    <label className={chrome.label}>Target Role</label>
                    <select value={state.role} onChange={(e) => onPatch({ role: e.target.value })} className={chrome.input}>
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <p className={chrome.hint}>AI will generate MCQs relevant to this job role.</p>
                </div>
            )}

            {/* Interview topic (Voice only) */}
            {def.type === "voice" && (
                <div className="space-y-2">
                    <label className={chrome.label}>Interview Topic *</label>
                    <input value={state.topic} onChange={(e) => onPatch({ topic: e.target.value })} required
                        className={chrome.input} placeholder="e.g. React Hooks, System Design, OOP Concepts" />
                    <p className={chrome.hint}>AI will ask verbal questions on this topic.</p>
                </div>
            )}

            {def.supportsAdaptive && (
                <ModeSelector mode={state.mode} onChange={(mode) => onPatch({ mode })}
                    accent={def.accent} theme={theme} adaptiveHint={def.adaptiveHint} />
            )}

            <div className="grid grid-cols-2 gap-4">
                {/* Left: level slider, or the adaptive explainer */}
                {isAdaptive ? (
                    <div className="space-y-2">
                        <label className={chrome.label}>Starting Level</label>
                        <p className={`text-sm font-bold ${accent.value}`}>Level 1 ({LEVEL_LABELS[1]})</p>
                        <p className={chrome.hint}>{def.adaptiveNote}</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <label className={chrome.label}>
                            Difficulty Level: <span className={`font-bold ${accent.value}`}>{state.level}</span>
                            <span className={`ml-1 ${theme === "light" ? "text-gray-400" : "text-gray-500"}`}>({LEVEL_LABELS[state.level]})</span>
                        </label>
                        <input type="range" min={1} max={10} value={state.level}
                            onChange={(e) => onPatch({ level: Number(e.target.value) })}
                            className={`w-full ${accent.range}`} />
                        {def.levelHint && <p className={chrome.hint}>{def.levelHint}</p>}
                    </div>
                )}

                {/* Right: count, plus the language picker for the debug round */}
                {def.type === "debug" ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className={chrome.label}>{def.countLabel}</label>
                            <input type="number" min={def.countMin} max={def.countMax} value={state.count}
                                onChange={(e) => onPatch({ count: Number(e.target.value) })} className={chrome.input} />
                        </div>
                        <div className="space-y-2">
                            <label className={chrome.label}>Language</label>
                            <select value={state.language}
                                onChange={(e) => onPatch({ language: e.target.value as "python" | "java" | "cpp" })}
                                className={chrome.input}>
                                <option value="python">Python</option>
                                <option value="java">Java</option>
                                <option value="cpp">C++</option>
                            </select>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <label className={chrome.label}>{def.countLabel}</label>
                        <input type="number" min={def.countMin} max={def.countMax} value={state.count}
                            onChange={(e) => onPatch({ count: Number(e.target.value) })} className={chrome.input} />
                    </div>
                )}
            </div>
        </div>
    );
}

function ModeSelector({ mode, onChange, accent, theme, adaptiveHint }: {
    mode: DifficultyMode;
    onChange: (mode: DifficultyMode) => void;
    accent: AccentName;
    theme: BuilderTheme;
    adaptiveHint?: string;
}) {
    const chrome = BUILDER_CHROME[theme];
    const tokens = BUILDER_ACCENTS[theme][accent];

    return (
        <div className="space-y-2">
            <label className={chrome.label}>Difficulty Mode</label>
            <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => onChange("fixed")}
                    className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all ${
                        mode === "fixed" ? tokens.modeActive : chrome.modeInactive
                    }`}
                >
                    <SlidersHorizontal className={`h-5 w-5 shrink-0 ${mode === "fixed" ? tokens.modeIcon : "text-gray-500"}`} />
                    <div>
                        <p className="text-sm font-bold">Fixed Level</p>
                        <p className="text-[11px] opacity-70">Same difficulty throughout</p>
                    </div>
                </button>
                <button type="button" onClick={() => onChange("adaptive")}
                    className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all ${
                        mode === "adaptive" ? tokens.modeActive : chrome.modeInactive
                    }`}
                >
                    <TrendingUp className={`h-5 w-5 shrink-0 ${mode === "adaptive" ? tokens.modeIcon : "text-gray-500"}`} />
                    <div>
                        <p className="text-sm font-bold">Adaptive Mode</p>
                        <p className="text-[11px] opacity-70">Adjusts to the student</p>
                    </div>
                </button>
            </div>
            {mode === "adaptive" && adaptiveHint && <p className={chrome.hint}>{adaptiveHint}</p>}
        </div>
    );
}
