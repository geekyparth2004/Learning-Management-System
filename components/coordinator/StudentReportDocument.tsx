import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { StudentReportData } from "@/lib/report-data";
import type { ReportAnalysis } from "@/lib/report-analysis";
import type { CodeEfficiencyReport } from "@/lib/report-code-analysis";

// ── Palette ──
const C = {
    brand: "#2563eb",
    brandDark: "#1e3a8a",
    ink: "#111827",
    body: "#374151",
    muted: "#6b7280",
    faint: "#9ca3af",
    line: "#e5e7eb",
    panel: "#f3f4f6",
    panelBlue: "#eff6ff",
    green: "#16a34a",
    greenBg: "#f0fdf4",
    red: "#dc2626",
    redBg: "#fef2f2",
    amber: "#d97706",
    amberBg: "#fffbeb",
    codeBg: "#f8fafc",
    white: "#ffffff",
};

const s = StyleSheet.create({
    page: { paddingTop: 54, paddingBottom: 48, paddingHorizontal: 44, fontSize: 10, color: C.body, fontFamily: "Helvetica", lineHeight: 1.5 },
    // running header / footer
    runHeader: { position: "absolute", top: 22, left: 44, right: 44, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: C.faint },
    runFooter: { position: "absolute", bottom: 22, left: 44, right: 44, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: C.faint, borderTop: `1 solid ${C.line}`, paddingTop: 6 },

    // section
    sectionTitle: { fontSize: 15, fontFamily: "Helvetica-Bold", color: C.brandDark, marginBottom: 4 },
    sectionRule: { height: 2, backgroundColor: C.brand, width: 46, marginBottom: 12 },
    subTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.ink, marginTop: 12, marginBottom: 6 },
    para: { fontSize: 10, color: C.body, marginBottom: 8, textAlign: "justify" },

    // cover — explicit lineHeight on every node so large fonts don't inherit the page's
    // 1.5 multiplier (which collapses their line boxes and overlaps the text).
    coverWrap: { paddingTop: 130 },
    coverKicker: { fontSize: 11, letterSpacing: 3, color: C.brand, fontFamily: "Helvetica-Bold", lineHeight: 1.2 },
    coverTitleWrap: { marginTop: 14, marginBottom: 12 },
    coverTitleLine: { fontSize: 30, fontFamily: "Helvetica-Bold", color: C.ink, lineHeight: 1.25 },
    coverSub: { fontSize: 13, color: C.muted, lineHeight: 1.3 },
    coverIdentity: { marginTop: 36 },
    coverName: { fontSize: 24, fontFamily: "Helvetica-Bold", color: C.brandDark, lineHeight: 1.2 },
    coverMeta: { fontSize: 11, color: C.muted, lineHeight: 1.4, marginTop: 5 },
    coverStrip: { flexDirection: "row", flexWrap: "wrap", marginTop: 36, borderTop: `1 solid ${C.line}`, paddingTop: 18 },
    coverStat: { width: "33.33%", marginBottom: 18 },
    coverStatVal: { fontSize: 20, fontFamily: "Helvetica-Bold", color: C.brand, lineHeight: 1.2 },
    coverStatLbl: { fontSize: 8.5, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, lineHeight: 1.3, marginTop: 3 },

    // key-value table
    kv: { flexDirection: "row", borderBottom: `1 solid ${C.line}`, paddingVertical: 5 },
    kvKey: { width: "34%", fontSize: 9.5, color: C.muted },
    kvVal: { width: "66%", fontSize: 9.5, color: C.ink, fontFamily: "Helvetica-Bold" },

    // stat grid
    statGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
    statCell: { width: "25%", padding: 4 },
    statBox: { border: `1 solid ${C.line}`, borderRadius: 5, padding: 8, height: 52, justifyContent: "center" },
    statVal: { fontSize: 15, fontFamily: "Helvetica-Bold", color: C.ink },
    statLbl: { fontSize: 7.5, color: C.muted, marginTop: 2 },

    // generic table
    tRow: { flexDirection: "row", borderBottom: `1 solid ${C.line}`, paddingVertical: 5, alignItems: "flex-start" },
    tHead: { flexDirection: "row", backgroundColor: C.panel, paddingVertical: 6, paddingHorizontal: 2, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
    th: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.muted, textTransform: "uppercase", letterSpacing: 0.3 },
    td: { fontSize: 9, color: C.body, paddingRight: 4 },

    // rating bar
    ratingRow: { marginBottom: 12 },
    ratingTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
    ratingName: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.ink },
    ratingScore: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.brand },
    ratingTrack: { height: 7, backgroundColor: C.panel, borderRadius: 4 },
    ratingFill: { height: 7, backgroundColor: C.brand, borderRadius: 4 },
    ratingNote: { fontSize: 8.5, color: C.muted, marginTop: 3 },

    // bullets
    bulletRow: { flexDirection: "row", marginBottom: 5 },
    bulletDot: { width: 12, fontSize: 10 },
    bulletText: { flex: 1, fontSize: 9.5, color: C.body },

    // panels
    panel: { borderRadius: 6, padding: 12, marginBottom: 10 },
    panelLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },

    // assessment / question cards
    aHeader: { backgroundColor: C.panelBlue, borderRadius: 6, padding: 10, marginBottom: 8 },
    aTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.brandDark },
    aMeta: { fontSize: 8.5, color: C.muted, marginTop: 2 },
    roundHeader: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, marginBottom: 5, paddingBottom: 3, borderBottom: `1 solid ${C.line}` },
    roundName: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: C.ink },
    roundScore: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: C.brand },
    qCard: { marginBottom: 7, paddingLeft: 8, borderLeft: `2 solid ${C.line}` },
    qText: { fontSize: 9, color: C.ink, marginBottom: 2 },
    qMeta: { fontSize: 8.5, color: C.muted },

    badge: { fontSize: 7.5, fontFamily: "Helvetica-Bold", paddingVertical: 1, paddingHorizontal: 5, borderRadius: 3 },

    code: { fontFamily: "Courier", fontSize: 8, color: "#0f172a", backgroundColor: C.codeBg, border: `1 solid ${C.line}`, borderRadius: 4, padding: 7, marginTop: 3, lineHeight: 1.4 },

    note: { fontSize: 8.5, color: C.faint, fontStyle: "italic", marginTop: 6 },
});

// ── helpers ──
const fmtDate = (iso: string | null) => {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
    } catch {
        return "—";
    }
};
const fmtDateTime = (iso: string | null) => {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleString("en-US", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch {
        return "—";
    }
};
const ROUND_LABELS: Record<string, string> = {
    mcq: "MCQ Round", aptitude: "Aptitude Round", coding: "Coding Round", voice: "Voice Interview",
    debug: "Debug Challenge", output: "Output Prediction", sql: "SQL Round", email: "Email Writing",
};

function RunningChrome({ orgName, studentName }: { orgName: string; studentName: string }) {
    return (
        <>
            <View fixed style={s.runHeader}>
                <Text>{orgName} · Student Evaluation Report</Text>
                <Text>{studentName}</Text>
            </View>
            <Text
                fixed
                style={s.runFooter}
                render={({ pageNumber, totalPages }) => `CONFIDENTIAL — for placement-cell use only        Page ${pageNumber} of ${totalPages}`}
            />
        </>
    );
}

function SectionHeader({ title }: { title: string }) {
    return (
        <View>
            <Text style={s.sectionTitle}>{title}</Text>
            <View style={s.sectionRule} />
        </View>
    );
}

function KV({ k, v }: { k: string; v: string }) {
    return (
        <View style={s.kv}>
            <Text style={s.kvKey}>{k}</Text>
            <Text style={s.kvVal}>{v || "—"}</Text>
        </View>
    );
}

function StatBox({ value, label }: { value: string | number; label: string }) {
    return (
        <View style={s.statCell}>
            <View style={s.statBox}>
                <Text style={s.statVal}>{value}</Text>
                <Text style={s.statLbl}>{label}</Text>
            </View>
        </View>
    );
}

function Bullet({ children, color }: { children: string; color?: string }) {
    return (
        <View style={s.bulletRow} wrap={false}>
            <Text style={[s.bulletDot, { color: color || C.brand }]}>•</Text>
            <Text style={s.bulletText}>{children}</Text>
        </View>
    );
}

function Badge({ label, tone }: { label: string; tone: "green" | "red" | "amber" | "gray" }) {
    const map = {
        green: { color: C.green, backgroundColor: C.greenBg },
        red: { color: C.red, backgroundColor: C.redBg },
        amber: { color: C.amber, backgroundColor: C.amberBg },
        gray: { color: C.muted, backgroundColor: C.panel },
    }[tone];
    return <Text style={[s.badge, map]}>{label}</Text>;
}

function CodeBlock({ code }: { code: string }) {
    // react-pdf wraps long lines; normalise tabs so indentation renders predictably.
    const text = (code || "").replace(/\t/g, "    ").replace(/\r/g, "");
    return <Text style={s.code}>{text || "(no code)"}</Text>;
}

export interface StudentReportDocumentProps {
    data: StudentReportData;
    analysis: ReportAnalysis;
    codeReport: CodeEfficiencyReport;
}

export default function StudentReportDocument({ data, analysis, codeReport }: StudentReportDocumentProps) {
    const { student, profile, stats, externalPlatforms } = data;
    const orgName = data.organizationName;

    return (
        <Document
            title={`Student Report — ${student.name}`}
            author={orgName}
            subject="Student Evaluation Report"
        >
            {/* ══ COVER ══ */}
            <Page size="A4" style={s.page}>
                <View style={s.coverWrap}>
                    <Text style={s.coverKicker}>STUDENT EVALUATION REPORT</Text>
                    <View style={s.coverTitleWrap}>
                        <Text style={s.coverTitleLine}>Comprehensive</Text>
                        <Text style={s.coverTitleLine}>Performance Dossier</Text>
                    </View>
                    <Text style={s.coverSub}>Prepared for the Training &amp; Placement Cell</Text>

                    <View style={s.coverIdentity}>
                        <Text style={s.coverName}>{student.name}</Text>
                        <Text style={s.coverMeta}>{student.email}{profile?.department ? `  ·  ${profile.department}` : ""}{profile?.batch ? `  ·  Batch ${profile.batch}` : ""}</Text>
                        <Text style={s.coverMeta}>{orgName}</Text>
                    </View>

                    <View style={s.coverStrip}>
                        <View style={s.coverStat}><Text style={s.coverStatVal}>{stats.totalProblemsSolved}</Text><Text style={s.coverStatLbl}>Problems Solved</Text></View>
                        <View style={s.coverStat}><Text style={s.coverStatVal}>{stats.assessmentsTaken}</Text><Text style={s.coverStatLbl}>Assessments Taken</Text></View>
                        <View style={s.coverStat}><Text style={s.coverStatVal}>{stats.contestsParticipated}</Text><Text style={s.coverStatLbl}>Contests</Text></View>
                        <View style={s.coverStat}><Text style={s.coverStatVal}>{stats.hackathonsParticipated}</Text><Text style={s.coverStatLbl}>Hackathons</Text></View>
                        <View style={s.coverStat}><Text style={s.coverStatVal}>{stats.totalLearningHours}h</Text><Text style={s.coverStatLbl}>Learning Hours</Text></View>
                        <View style={s.coverStat}><Text style={s.coverStatVal}>{profile?.cgpa != null ? profile.cgpa.toFixed(2) : "—"}</Text><Text style={s.coverStatLbl}>CGPA</Text></View>
                    </View>

                    <Text style={[s.coverMeta, { marginTop: 30 }]}>Generated {fmtDateTime(data.generatedAt)}</Text>
                </View>
                <Text fixed style={s.runFooter} render={({ pageNumber, totalPages }) => `CONFIDENTIAL — for placement-cell use only        Page ${pageNumber} of ${totalPages}`} />
            </Page>

            {/* ══ PROFILE + SUMMARY + RATINGS + SWOT ══ */}
            <Page size="A4" style={s.page}>
                <RunningChrome orgName={orgName} studentName={student.name} />

                <SectionHeader title="1. Personal & Academic Details" />
                <KV k="Full Name" v={student.name} />
                <KV k="Email" v={student.email} />
                <KV k="Phone" v={student.phone || "—"} />
                <KV k="Father's Name" v={profile?.fatherName || "—"} />
                <KV k="Degree" v={profile?.degree || "—"} />
                <KV k="Department" v={profile?.department || "—"} />
                <KV k="Batch" v={profile?.batch || "—"} />
                <KV k="CGPA" v={profile?.cgpa != null ? profile.cgpa.toFixed(2) : "—"} />
                <KV k="UG Percentage" v={profile?.ugPercentage != null ? `${profile.ugPercentage}%` : "—"} />
                <KV k="PG Percentage" v={profile?.pgPercentage != null ? `${profile.pgPercentage}%` : "—"} />
                <KV k="Skills" v={profile?.skills || "—"} />
                <KV k="Registered On" v={fmtDate(student.joinedAt)} />
                {(externalPlatforms.leetcode || externalPlatforms.codolio) && (
                    <KV k="Coding Profiles" v={[externalPlatforms.leetcode && `LeetCode: ${externalPlatforms.leetcode}`, externalPlatforms.codolio && `Codolio: ${externalPlatforms.codolio}`].filter(Boolean).join("   ")} />
                )}

                <View style={{ marginTop: 18 }}>
                    <SectionHeader title="2. Executive Summary" />
                    <Text style={s.para}>{analysis.executiveSummary}</Text>
                    <View style={[s.panel, { backgroundColor: C.panelBlue }]}>
                        <Text style={[s.panelLabel, { color: C.brand }]}>Placement Readiness</Text>
                        <Text style={{ fontSize: 10, color: C.body }}>{analysis.overallReadiness}</Text>
                    </View>
                    {analysis.isFallback && <Text style={s.note}>Skill analysis is limited because the student has little or no assessment history.</Text>}
                </View>

                {analysis.subjectRatings.length > 0 && (
                    <View style={{ marginTop: 18 }} break>
                        <SectionHeader title="3. Skill Ratings by Domain" />
                        {analysis.subjectRatings.map((r, i) => (
                            <View key={i} style={s.ratingRow} wrap={false}>
                                <View style={s.ratingTop}>
                                    <Text style={s.ratingName}>{r.subject}</Text>
                                    <Text style={s.ratingScore}>{r.score}/10</Text>
                                </View>
                                <View style={s.ratingTrack}>
                                    <View style={[s.ratingFill, { width: `${r.score * 10}%`, backgroundColor: r.score >= 7 ? C.green : r.score >= 4 ? C.brand : C.red }]} />
                                </View>
                                {!!r.comment && <Text style={s.ratingNote}>{r.comment}</Text>}
                            </View>
                        ))}
                    </View>
                )}

                {(analysis.strengths.length > 0 || analysis.weaknesses.length > 0 || analysis.improvementAreas.length > 0) && (
                    <View style={{ marginTop: 18 }} break>
                        <SectionHeader title="4. Strengths, Weaknesses & Improvement Plan" />
                        {analysis.strengths.length > 0 && (
                            <View style={[s.panel, { backgroundColor: C.greenBg }]}>
                                <Text style={[s.panelLabel, { color: C.green }]}>Strengths</Text>
                                {analysis.strengths.map((t, i) => <Bullet key={i} color={C.green}>{t}</Bullet>)}
                            </View>
                        )}
                        {analysis.weaknesses.length > 0 && (
                            <View style={[s.panel, { backgroundColor: C.redBg }]}>
                                <Text style={[s.panelLabel, { color: C.red }]}>Weak Points</Text>
                                {analysis.weaknesses.map((t, i) => <Bullet key={i} color={C.red}>{t}</Bullet>)}
                            </View>
                        )}
                        {analysis.improvementAreas.length > 0 && (
                            <View style={[s.panel, { backgroundColor: C.amberBg }]}>
                                <Text style={[s.panelLabel, { color: C.amber }]}>How to Improve</Text>
                                {analysis.improvementAreas.map((t, i) => <Bullet key={i} color={C.amber}>{t}</Bullet>)}
                            </View>
                        )}
                    </View>
                )}
            </Page>

            {/* ══ ACTIVITY + PROBLEMS + COURSES ══ */}
            <Page size="A4" style={s.page}>
                <RunningChrome orgName={orgName} studentName={student.name} />

                <SectionHeader title="5. Platform Activity Overview" />
                <View style={s.statGrid}>
                    <StatBox value={`${stats.totalLearningHours}h`} label="Total Learning" />
                    <StatBox value={stats.currentStreak} label="Day Streak" />
                    <StatBox value={stats.internalProblemsSolved} label="Platform Problems" />
                    <StatBox value={stats.externalProblemsSolved} label="External Problems" />
                    <StatBox value={stats.contestsParticipated} label="Contests" />
                    <StatBox value={stats.hackathonsParticipated} label="Hackathons" />
                    <StatBox value={stats.assessmentsTaken} label="Assessments" />
                    <StatBox value={stats.coursesEnrolled} label="Courses" />
                </View>

                <View style={{ marginTop: 18 }}>
                    <SectionHeader title="6. Problems Solved" />
                    <Text style={[s.para, { marginBottom: 6 }]}>
                        {stats.internalProblemsSolved} distinct problems solved on the platform, listed most-recent first with the date each was first solved.
                    </Text>
                    {data.solvedProblems.length === 0 ? (
                        <Text style={s.qMeta}>No problems solved on the platform yet.</Text>
                    ) : (
                        <View>
                            <View style={s.tHead}>
                                <Text style={[s.th, { width: "6%" }]}>#</Text>
                                <Text style={[s.th, { width: "48%" }]}>Problem</Text>
                                <Text style={[s.th, { width: "16%" }]}>Difficulty</Text>
                                <Text style={[s.th, { width: "14%" }]}>Language</Text>
                                <Text style={[s.th, { width: "16%" }]}>Solved On</Text>
                            </View>
                            {data.solvedProblems.map((p, i) => (
                                <View key={p.problemId} style={s.tRow} wrap={false}>
                                    <Text style={[s.td, { width: "6%" }]}>{i + 1}</Text>
                                    <Text style={[s.td, { width: "48%" }]}>{p.title}</Text>
                                    <Text style={[s.td, { width: "16%" }]}>{p.difficulty || "—"}</Text>
                                    <Text style={[s.td, { width: "14%" }]}>{p.language}</Text>
                                    <Text style={[s.td, { width: "16%" }]}>{fmtDate(p.solvedAt)}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                    {data.solvedProblemsTruncated && (
                        <Text style={s.note}>Showing the {data.solvedProblems.length} most recent of {stats.internalProblemsSolved} solved problems.</Text>
                    )}
                </View>

                {data.courses.length > 0 && (
                    <View style={{ marginTop: 18 }}>
                        <SectionHeader title="7. Course Enrollments" />
                        <View style={s.tHead}>
                            <Text style={[s.th, { width: "54%" }]}>Course</Text>
                            <Text style={[s.th, { width: "20%" }]}>Status</Text>
                            <Text style={[s.th, { width: "26%" }]}>Completion</Text>
                        </View>
                        {data.courses.map((c, i) => (
                            <View key={i} style={s.tRow} wrap={false}>
                                <Text style={[s.td, { width: "54%" }]}>{c.title}</Text>
                                <Text style={[s.td, { width: "20%" }]}>{c.status === "COMPLETED" ? "Completed" : "Active"}</Text>
                                <Text style={[s.td, { width: "26%" }]}>{c.completedItems}/{c.totalItems} items ({c.completionPercentage}%)</Text>
                            </View>
                        ))}
                    </View>
                )}
            </Page>

            {/* ══ CONTESTS + HACKATHONS ══ */}
            <Page size="A4" style={s.page}>
                <RunningChrome orgName={orgName} studentName={student.name} />

                <SectionHeader title="8. Contests Attended" />
                {data.contests.length === 0 ? (
                    <Text style={s.qMeta}>No contests attended.</Text>
                ) : (
                    <View>
                        <View style={s.tHead}>
                            <Text style={[s.th, { width: "40%" }]}>Contest</Text>
                            <Text style={[s.th, { width: "22%" }]}>Held On</Text>
                            <Text style={[s.th, { width: "24%" }]}>Attended</Text>
                            <Text style={[s.th, { width: "14%" }]}>Score</Text>
                        </View>
                        {data.contests.map((c, i) => (
                            <View key={i} style={s.tRow} wrap={false}>
                                <Text style={[s.td, { width: "40%" }]}>{c.title}</Text>
                                <Text style={[s.td, { width: "22%" }]}>{fmtDate(c.startTime)}</Text>
                                <Text style={[s.td, { width: "24%" }]}>{fmtDateTime(c.startedAt || c.joinedAt)}</Text>
                                <Text style={[s.td, { width: "14%" }]}>{c.score}</Text>
                            </View>
                        ))}
                    </View>
                )}

                <View style={{ marginTop: 20 }}>
                    <SectionHeader title="9. Hackathons Attended" />
                    {data.hackathons.length === 0 ? (
                        <Text style={s.qMeta}>No hackathons attended.</Text>
                    ) : (
                        <View>
                            <View style={s.tHead}>
                                <Text style={[s.th, { width: "40%" }]}>Hackathon</Text>
                                <Text style={[s.th, { width: "22%" }]}>Held On</Text>
                                <Text style={[s.th, { width: "24%" }]}>Attended</Text>
                                <Text style={[s.th, { width: "14%" }]}>Score</Text>
                            </View>
                            {data.hackathons.map((c, i) => (
                                <View key={i} style={s.tRow} wrap={false}>
                                    <Text style={[s.td, { width: "40%" }]}>{c.title}</Text>
                                    <Text style={[s.td, { width: "22%" }]}>{fmtDate(c.startTime)}</Text>
                                    <Text style={[s.td, { width: "24%" }]}>{fmtDateTime(c.startedAt || c.joinedAt)}</Text>
                                    <Text style={[s.td, { width: "14%" }]}>{c.score}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </Page>

            {/* ══ ASSESSMENT QUESTION-WISE BREAKDOWN ══ */}
            <Page size="A4" style={s.page}>
                <RunningChrome orgName={orgName} studentName={student.name} />
                <SectionHeader title="10. Assessment Performance — Question by Question" />

                {data.assessments.length === 0 ? (
                    <Text style={s.qMeta}>This student has not attempted any assessments.</Text>
                ) : (
                    data.assessments.map((a, ai) => (
                        <View key={ai} style={{ marginBottom: 14 }} break={ai > 0}>
                            <View style={s.aHeader}>
                                <Text style={s.aTitle}>{a.title}</Text>
                                <Text style={s.aMeta}>
                                    Score {a.score}   ·   Taken {fmtDateTime(a.completedAt || a.joinedAt)}
                                    {a.autoSubmitted ? "   ·   AUTO-SUBMITTED" : ""}
                                    {a.warningCount ? `   ·   ${a.warningCount} proctoring warning(s)` : ""}
                                </Text>
                            </View>
                            {a.rounds.length === 0 ? (
                                <Text style={s.qMeta}>No detailed results were recorded for this assessment.</Text>
                            ) : (
                                a.rounds.map((round: any, ri: number) => (
                                    <RoundBlock key={ri} round={round} />
                                ))
                            )}
                        </View>
                    ))
                )}
            </Page>

            {/* ══ MODEL SOLUTIONS ══ */}
            {analysis.questionSolutions.length > 0 && (
                <Page size="A4" style={s.page}>
                    <RunningChrome orgName={orgName} studentName={student.name} />
                    <SectionHeader title="11. Model Solutions & Error Analysis" />
                    <Text style={[s.para, { marginBottom: 10 }]}>
                        For each question the student did not fully solve, the correct approach is given below with a note on what went wrong.
                    </Text>
                    {analysis.questionSolutions.map((q, i) => (
                        <View key={i} style={{ marginBottom: 12 }} wrap={false}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                                <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: C.ink, flex: 1, paddingRight: 8 }}>
                                    {q.round ? `[${(ROUND_LABELS[q.round] || q.round)}] ` : ""}{q.question}
                                </Text>
                                <Badge label={q.verdict || "Reviewed"} tone={/correct$/i.test(q.verdict) ? "green" : /partial/i.test(q.verdict) ? "amber" : "red"} />
                            </View>
                            {!!q.assessment && <Text style={[s.qMeta, { marginBottom: 3 }]}>From: {q.assessment}</Text>}
                            {!!q.whatWentWrong && (
                                <Text style={{ fontSize: 9, color: C.red, marginBottom: 3 }}>What went wrong: {q.whatWentWrong}</Text>
                            )}
                            <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: C.muted }}>MODEL SOLUTION</Text>
                            <CodeBlock code={q.modelSolution} />
                        </View>
                    ))}
                </Page>
            )}

            {/* ══ CODE EFFICIENCY & OPTIMIZATION ══ */}
            {codeReport.reviews.length > 0 && (
                <Page size="A4" style={s.page}>
                    <RunningChrome orgName={orgName} studentName={student.name} />
                    <SectionHeader title="12. Code Efficiency & Optimization" />
                    <Text style={[s.para, { marginBottom: 6 }]}>
                        A review of the last {codeReport.reviews.length} code submission{codeReport.reviews.length === 1 ? "" : "s"} the student wrote —
                        how efficiently each was written, with the most efficient version of the same solution.
                    </Text>
                    {!!codeReport.overallCommentary && (
                        <View style={[s.panel, { backgroundColor: C.panelBlue, marginBottom: 12 }]}>
                            <Text style={[s.panelLabel, { color: C.brand }]}>Overall Coding Efficiency</Text>
                            <Text style={{ fontSize: 10, color: C.body }}>{codeReport.overallCommentary}</Text>
                        </View>
                    )}
                    {codeReport.isFallback && (
                        <Text style={[s.note, { marginBottom: 8 }]}>
                            Automated optimization notes are unavailable; the student&apos;s submitted code is shown below.
                        </Text>
                    )}

                    {codeReport.reviews.map((r, i) => (
                        <View key={i} style={{ marginBottom: 16 }} break={i > 0}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                                <Text style={{ fontSize: 10.5, fontFamily: "Helvetica-Bold", color: C.ink, flex: 1, paddingRight: 8 }}>
                                    {i + 1}. {r.problemTitle}
                                </Text>
                                <Badge label={r.status === "PASSED" ? "Passed" : "Failed"} tone={r.status === "PASSED" ? "green" : "red"} />
                            </View>
                            <Text style={[s.qMeta, { marginBottom: 4 }]}>
                                {r.language}   ·   submitted {fmtDateTime(r.submittedAt)}
                                {!codeReport.isFallback ? `   ·   efficiency ${r.efficiencyScore}/10   ·   time ${r.timeComplexity}, space ${r.spaceComplexity}` : ""}
                            </Text>

                            <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: C.muted }}>STUDENT&apos;S CODE</Text>
                            <CodeBlock code={r.studentCode} />

                            {!codeReport.isFallback && (
                                <>
                                    {!!r.assessment && (
                                        <Text style={{ fontSize: 9, color: C.body, marginTop: 5 }}>
                                            <Text style={{ fontFamily: "Helvetica-Bold", color: C.amber }}>Assessment: </Text>
                                            {r.assessment}
                                        </Text>
                                    )}
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 5 }}>
                                        <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: C.green }}>MOST EFFICIENT VERSION</Text>
                                        <Text style={{ fontSize: 8, color: C.muted }}>Optimized: {r.optimizedComplexity}</Text>
                                    </View>
                                    <CodeBlock code={r.optimizedCode || "(already optimal)"} />
                                </>
                            )}
                        </View>
                    ))}
                </Page>
            )}
        </Document>
    );
}

// ── one assessment round's per-question detail ──
function RoundBlock({ round }: { round: any }) {
    const type: string = round.type;
    const label = ROUND_LABELS[type] || type;

    let scoreText = "";
    if (type === "mcq" || type === "aptitude") scoreText = `${round.correct ?? 0}/${round.totalQuestions ?? round.questions?.length ?? 0} correct`;
    else if (type === "coding") scoreText = `${round.passedTestCases ?? 0}/${round.totalTestCases ?? 0} tests · ${round.score ?? 0} marks`;
    else if (type === "debug") scoreText = `${round.solved ?? 0}/${round.total ?? 0} fixed · ${round.score ?? 0} marks`;
    else if (type === "sql") scoreText = `${round.passedTestCases ?? 0}/${round.totalTestCases ?? 0} tests · ${round.score ?? 0} marks`;
    else if (type === "output") scoreText = `${round.correct ?? 0}/${round.totalQuestions ?? 0} correct`;
    else scoreText = `${round.score ?? 0}/${round.maxScore ?? 0} marks`;

    return (
        <View style={{ marginBottom: 6 }}>
            <View style={s.roundHeader}>
                <Text style={s.roundName}>{label}{round.adaptive ? `  (adaptive · peak L${round.highestLevel ?? 1})` : ""}</Text>
                <Text style={s.roundScore}>{scoreText}</Text>
            </View>

            {(type === "mcq" || type === "aptitude") && (round.questions || []).map((q: any, i: number) => {
                const correct = q.selectedIndex === q.correctIndex;
                const letter = (idx: number | null | undefined) => (idx == null ? "—" : String.fromCharCode(65 + idx));
                return (
                    <View key={i} style={s.qCard} wrap={false}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            <Text style={[s.qText, { flex: 1, paddingRight: 6 }]}>Q{i + 1}. {q.question}</Text>
                            <Badge label={correct ? "Correct" : q.selectedIndex == null ? "Skipped" : "Wrong"} tone={correct ? "green" : q.selectedIndex == null ? "gray" : "red"} />
                        </View>
                        <Text style={s.qMeta}>Student chose {letter(q.selectedIndex)} · Correct answer {letter(q.correctIndex)}{q.level ? ` · Level ${q.level}` : ""}</Text>
                    </View>
                );
            })}

            {type === "coding" && (round.problems || []).map((p: any, i: number) => (
                <View key={i} style={s.qCard} wrap={false}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={[s.qText, { flex: 1, paddingRight: 6 }]}>{p.title || `Problem ${i + 1}`}</Text>
                        <Badge label={`${p.passedCount ?? 0}/${p.testCaseCount ?? 0} tests`} tone={p.passedCount === p.testCaseCount && p.testCaseCount > 0 ? "green" : p.passedCount > 0 ? "amber" : "red"} />
                    </View>
                    {!!p.level && <Text style={s.qMeta}>Adaptive level {p.level}</Text>}
                </View>
            ))}

            {type === "debug" && (round.challenges || []).map((c: any, i: number) => (
                <View key={i} style={s.qCard}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={[s.qText, { flex: 1, paddingRight: 6 }]}>{c.title || `Challenge ${i + 1}`}</Text>
                        <Badge label={c.passed ? "Fixed" : `${c.passedCount ?? 0}/${c.testCaseCount ?? 0}`} tone={c.passed ? "green" : "red"} />
                    </View>
                    {!!c.finalCode && (
                        <>
                            <Text style={[s.qMeta, { marginTop: 2 }]}>Student&apos;s submitted fix:</Text>
                            <CodeBlock code={c.finalCode} />
                        </>
                    )}
                </View>
            ))}

            {type === "sql" && (round.questions || []).map((q: any, i: number) => (
                <View key={i} style={s.qCard}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={[s.qText, { flex: 1, paddingRight: 6 }]}>{q.title || `Question ${i + 1}`}</Text>
                        <Badge label={`${q.passedCount ?? 0}/${q.testCaseCount ?? 0} tests`} tone={q.passedCount === q.testCaseCount && q.testCaseCount > 0 ? "green" : q.passedCount > 0 ? "amber" : "red"} />
                    </View>
                    {!!q.finalQuery && (
                        <>
                            <Text style={[s.qMeta, { marginTop: 2 }]}>Student&apos;s query:</Text>
                            <CodeBlock code={q.finalQuery} />
                        </>
                    )}
                </View>
            ))}

            {type === "output" && (round.questions || []).map((q: any, i: number) => (
                <View key={i} style={s.qCard}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={[s.qText, { flex: 1, paddingRight: 6 }]}>Q{i + 1}. Predict the output ({q.language})</Text>
                        <Badge label={q.correct ? "Correct" : "Wrong"} tone={q.correct ? "green" : "red"} />
                    </View>
                    <CodeBlock code={q.code} />
                    <Text style={s.qMeta}>Expected: {q.expectedOutput}    ·    Student predicted: {q.predicted || "(blank)"}</Text>
                </View>
            ))}

            {type === "email" && (round.questions || []).map((q: any, i: number) => (
                <View key={i} style={s.qCard} wrap={false}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={[s.qText, { flex: 1, paddingRight: 6 }]}>{q.topic || `Email ${i + 1}`}</Text>
                        <Badge label={`${q.marks}/10`} tone={q.marks >= 7 ? "green" : q.marks >= 4 ? "amber" : "red"} />
                    </View>
                    <Text style={s.qMeta}>Grammar issues: {q.grammarIssues ?? "—"} · {q.feedback}</Text>
                </View>
            ))}

            {type === "voice" && (round.questions || []).map((q: any, i: number) => (
                <View key={i} style={s.qCard} wrap={false}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={[s.qText, { flex: 1, paddingRight: 6 }]}>Q{i + 1}. {q.question}</Text>
                        <Badge label={`${q.marks}/5`} tone={q.marks >= 3 ? "green" : q.marks > 0 ? "amber" : "red"} />
                    </View>
                    {!!q.feedback && <Text style={s.qMeta}>{q.feedback}</Text>}
                </View>
            ))}
        </View>
    );
}
