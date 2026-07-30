import React from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar, Globe, Users, Trophy, Building2 } from "lucide-react";
import { roundMeta, ROUND_META_FALLBACK, type RoundMeta } from "./round-meta";
import { BUILDER_CHROME, type BuilderTheme } from "./builder-theme";
import { ROUND_DEF_BY_TYPE } from "./round-defs";
import type { AdaptiveLevel } from "@/lib/assessment-results";

export interface DetailRegistration {
    id: string;
    name: string;
    joinedAt: string;
    startedAt: string | null;
    completedAt: string | null;
    score: number;
    adaptiveLevels: AdaptiveLevel[];
}

export interface AssessmentDetailViewProps {
    theme: BuilderTheme;
    backHref: string;
    backLabel?: string;
    assessment: {
        title: string;
        type: string;
        platformName: string | null;
        contestLink: string | null;
        startTime: string;
        endTime: string;
        duration: number | null;
        displayDescription: string;
    };
    /** Parsed from Contest.description JSON. */
    rounds: any[];
    registrations: DetailRegistration[];
    /** Shown next to the title, e.g. the organization an assessment is restricted to. */
    scopeBadge?: string | null;
    /** Rendered after the leaderboard — the teacher page passes the legacy problem editor. */
    children?: React.ReactNode;
}

export default function AssessmentDetailView({
    theme,
    backHref,
    backLabel = "Back to Assessments",
    assessment,
    rounds,
    registrations,
    scopeBadge,
    children,
}: AssessmentDetailViewProps) {
    const chrome = BUILDER_CHROME[theme];
    const meta = roundMeta(theme);
    const hasAdaptiveRound = rounds.some((r: any) => r.adaptive);
    const isLight = theme === "light";

    if (assessment.type === "EXTERNAL") {
        return (
            <div className={chrome.page}>
                <div className="max-w-4xl mx-auto">
                    <Link href={backHref} className={`mb-6 flex items-center gap-2 text-sm ${chrome.backLink}`}>
                        <ArrowLeft className="h-4 w-4" /> {backLabel}
                    </Link>
                    <div className={chrome.card}>
                        <h1 className={`mb-4 text-3xl font-bold ${isLight ? "text-gray-900" : ""}`}>
                            {assessment.title}
                            <span className="ml-2 rounded border border-orange-300 bg-orange-100 px-2 py-1 text-sm font-normal text-orange-700">
                                EXTERNAL
                            </span>
                        </h1>
                        <p className={`mb-6 ${chrome.subheading}`}>{assessment.displayDescription}</p>

                        <div className={`space-y-4 text-sm ${isLight ? "text-gray-700" : "text-gray-300"}`}>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>Starts: {new Date(assessment.startTime).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>Ends: {new Date(assessment.endTime).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                <span>Platform: {assessment.platformName}</span>
                            </div>
                            <div className={`mt-4 rounded border p-4 ${isLight ? "border-gray-200 bg-gray-50" : "border-gray-800 bg-[#111111]"}`}>
                                Link: <a href={assessment.contestLink || "#"} target="_blank" rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline">{assessment.contestLink}</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={chrome.page}>
            <div className="max-w-6xl mx-auto space-y-8">
                <Link href={backHref} className={`flex items-center gap-2 text-sm ${chrome.backLink}`}>
                    <ArrowLeft className="h-4 w-4" /> {backLabel}
                </Link>

                {/* Header Card */}
                <div className={`${chrome.card} space-y-4`}>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className={`mb-2 text-3xl font-bold ${isLight ? "text-gray-900" : ""}`}>{assessment.title}</h1>
                            <p className={chrome.subheading}>{assessment.displayDescription}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                            <span className={`rounded px-3 py-1 text-xs font-bold ${
                                isLight
                                    ? "border border-pink-200 bg-pink-50 text-pink-600"
                                    : "border border-pink-500/30 bg-pink-900/30 text-pink-400"
                            }`}>
                                AI ASSESSMENT
                            </span>
                            {scopeBadge && (
                                <span className={`flex items-center gap-1 rounded px-3 py-1 text-xs font-bold ${
                                    isLight
                                        ? "border border-blue-200 bg-blue-50 text-blue-600"
                                        : "border border-blue-500/30 bg-blue-900/30 text-blue-400"
                                }`}>
                                    <Building2 className="h-3 w-3" /> {scopeBadge} only
                                </span>
                            )}
                        </div>
                    </div>

                    <div className={`flex flex-wrap items-center gap-6 border-t pt-2 text-sm ${
                        isLight ? "border-gray-200 text-gray-500" : "border-gray-800 text-gray-500"
                    }`}>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <span>Starts: {new Date(assessment.startTime).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-green-500" />
                            <span>Ends: {new Date(assessment.endTime).toLocaleString()}</span>
                        </div>
                        {assessment.duration && (
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-purple-500" />
                                <span>Duration: {assessment.duration} min</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-orange-500" />
                            <span>{registrations.length} Students Registered</span>
                        </div>
                    </div>
                </div>

                {/* AI Configured Rounds */}
                {rounds.length > 0 && (
                    <div className={`${chrome.card} space-y-4`}>
                        <h2 className={`flex items-center gap-2 ${chrome.cardTitle}`}>
                            <Trophy className="h-5 w-5 text-pink-500" /> Assessment Rounds Configuration
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {rounds.map((round: any, idx: number) => {
                                const rm: RoundMeta = meta[round.type] || { ...ROUND_META_FALLBACK, label: round.type };
                                const Icon = rm.icon;
                                const rows = ROUND_DEF_BY_TYPE[round.type]?.summary(round) ?? [];
                                return (
                                    <div key={idx} className={`rounded-xl border p-4 space-y-2 ${rm.bg}`}>
                                        <div className="flex items-center gap-2 text-sm font-bold">
                                            <Icon className={`h-4 w-4 ${rm.color}`} />
                                            <span className={rm.color}>{rm.label}</span>
                                        </div>
                                        <div className={`space-y-1 text-xs ${isLight ? "text-gray-600" : "text-gray-300"}`}>
                                            {rows.map((row) => (
                                                <div key={row.label}>
                                                    {row.label}: <span className={chrome.strong}>{row.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Leaderboard */}
                <div className={`${chrome.card} space-y-4`}>
                    <h2 className={`flex items-center gap-2 ${chrome.cardTitle}`}>
                        <Users className="h-5 w-5 text-blue-500" /> Leaderboard — Student Submissions &amp; Scores
                    </h2>

                    {registrations.length === 0 ? (
                        <p className={chrome.emptyText}>No students have registered or attempted this assessment yet.</p>
                    ) : (
                        <div className={chrome.tableWrap}>
                            <table className={`w-full text-left text-sm ${isLight ? "text-gray-700" : "text-gray-300"}`}>
                                <thead className={chrome.tableHead}>
                                    <tr>
                                        <th className="px-4 py-3 w-16">Rank</th>
                                        <th className="px-4 py-3">Student</th>
                                        <th className="px-4 py-3">Joined At</th>
                                        <th className="px-4 py-3">Status</th>
                                        {hasAdaptiveRound && <th className="px-4 py-3">Highest Level</th>}
                                        <th className="px-4 py-3 text-right">Score</th>
                                    </tr>
                                </thead>
                                <tbody className={chrome.tableDivide}>
                                    {registrations.map((reg, idx) => (
                                        <tr key={reg.id} className={chrome.tableRow}>
                                            <td className={`px-4 py-3 font-bold ${
                                                idx === 0 ? "text-yellow-500" :
                                                idx === 1 ? (isLight ? "text-gray-500" : "text-gray-300") :
                                                idx === 2 ? "text-amber-600" : "text-gray-400"
                                            }`}>
                                                #{idx + 1}
                                            </td>
                                            <td className={`px-4 py-3 font-medium ${isLight ? "text-gray-900" : "text-white"}`}>
                                                {reg.name}
                                            </td>
                                            <td className={`px-4 py-3 ${chrome.mutedCell}`}>
                                                {new Date(reg.joinedAt).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                {reg.completedAt ? (
                                                    <span className={`rounded px-2 py-0.5 text-xs font-bold ${
                                                        isLight
                                                            ? "border border-green-200 bg-green-50 text-green-700"
                                                            : "border border-green-900 bg-green-900/30 text-green-400"
                                                    }`}>Completed</span>
                                                ) : reg.startedAt ? (
                                                    <span className={`rounded px-2 py-0.5 text-xs font-bold ${
                                                        isLight
                                                            ? "border border-yellow-200 bg-yellow-50 text-yellow-700"
                                                            : "border border-yellow-900 bg-yellow-900/30 text-yellow-400"
                                                    }`}>In Progress</span>
                                                ) : (
                                                    <span className={`rounded px-2 py-0.5 text-xs font-bold ${
                                                        isLight ? "bg-gray-100 text-gray-500" : "bg-gray-800 text-gray-400"
                                                    }`}>Registered</span>
                                                )}
                                            </td>
                                            {hasAdaptiveRound && (
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {reg.adaptiveLevels.map((lvl, i) => {
                                                            const rm = meta[lvl.type];
                                                            return (
                                                                <span key={i} className={`rounded border px-2 py-0.5 text-[10px] font-bold ${
                                                                    rm ? `${rm.bg} ${rm.color}` : "border-gray-700 bg-gray-800 text-gray-400"
                                                                }`}>
                                                                    {lvl.type.toUpperCase()} L{lvl.highestLevel}/10
                                                                </span>
                                                            );
                                                        })}
                                                        {reg.adaptiveLevels.length === 0 && (
                                                            <span className="text-xs text-gray-400">—</span>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                            <td className="px-4 py-3 text-right font-bold text-green-600">
                                                {reg.score}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {children}
            </div>
        </div>
    );
}
