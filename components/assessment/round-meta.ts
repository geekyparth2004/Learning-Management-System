import {
    CheckSquare,
    Code,
    Mic,
    Bug,
    Terminal,
    Database,
    Mail,
    Brain,
    type LucideIcon,
} from "lucide-react";

export type RoundType = "mcq" | "coding" | "voice" | "debug" | "output" | "sql" | "email" | "aptitude";

export interface RoundMeta {
    label: string;
    icon: LucideIcon;
    color: string;
    bg: string;
}

/** For dark surfaces (#0e0e0e / #161616) — student player, teacher panel. */
export const ROUND_META: Record<string, RoundMeta> = {
    mcq: { label: "MCQ Round", icon: CheckSquare, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/30" },
    coding: { label: "Coding Round", icon: Code, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30" },
    voice: { label: "Voice Round", icon: Mic, color: "text-green-400", bg: "bg-green-500/10 border-green-500/30" },
    debug: { label: "Debug Challenge", icon: Bug, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30" },
    output: { label: "Output Prediction", icon: Terminal, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/30" },
    sql: { label: "SQL Round", icon: Database, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/30" },
    email: { label: "Email Writing", icon: Mail, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
    aptitude: { label: "Aptitude Round", icon: Brain, color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/30" },
};

/**
 * For light surfaces (white cards on bg-gray-50) — the coordinator/TPO panel.
 * green/cyan/amber/teal use -700 because -600 washes out against a -50 background.
 */
export const ROUND_META_LIGHT: Record<string, RoundMeta> = {
    mcq: { label: "MCQ Round", icon: CheckSquare, color: "text-pink-600", bg: "bg-pink-50 border-pink-200" },
    coding: { label: "Coding Round", icon: Code, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
    voice: { label: "Voice Round", icon: Mic, color: "text-green-700", bg: "bg-green-50 border-green-200" },
    debug: { label: "Debug Challenge", icon: Bug, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
    output: { label: "Output Prediction", icon: Terminal, color: "text-cyan-700", bg: "bg-cyan-50 border-cyan-200" },
    sql: { label: "SQL Round", icon: Database, color: "text-violet-600", bg: "bg-violet-50 border-violet-200" },
    email: { label: "Email Writing", icon: Mail, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    aptitude: { label: "Aptitude Round", icon: Brain, color: "text-teal-700", bg: "bg-teal-50 border-teal-200" },
};

export type MetaTheme = "dark" | "light";

export function roundMeta(theme: MetaTheme): Record<string, RoundMeta> {
    return theme === "light" ? ROUND_META_LIGHT : ROUND_META;
}

/** Used when a stored round has an unrecognised type (e.g. config saved by an older build). */
export const ROUND_META_FALLBACK: RoundMeta = {
    label: "Round",
    icon: CheckSquare,
    color: "text-gray-400",
    bg: "bg-gray-800",
};
