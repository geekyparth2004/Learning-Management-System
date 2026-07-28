"use client";

import React, { useEffect, useState } from "react";
import {
    X,
    Clock,
    Trophy,
    Code2,
    Flame,
    GraduationCap,
    Building2,
    FileText,
    ExternalLink,
    BookOpen,
    Award,
    Briefcase,
    User,
    Mail,
    Phone,
    Calendar,
    Download,
    Loader2,
    Target,
    Zap,
} from "lucide-react";

interface StudentDetail {
    id: string;
    name: string;
    email: string;
    phone?: string;
    image?: string;
    createdAt: string;
    profile: {
        cgpa?: number;
        batch?: string;
        department?: string;
        degree?: string;
        fatherName?: string;
        ugPercentage?: number;
        pgPercentage?: number;
        skills?: string;
        resumeUrl?: string;
        resumeName?: string;
    } | null;
    stats: {
        totalLearningHours: number;
        todayLearningHours: number;
        problemsSolved: number;
        internalProblemsSolved: number;
        externalProblemsSolved: number;
        contestsParticipated: number;
        hackathonsParticipated: number;
        currentStreak: number;
        walletBalance: number;
        todaySubmissions: number;
        todayCompletedItems: number;
        coursesEnrolled: number;
        companiesApplied: number;
    };
    externalPlatforms: {
        leetcode?: string;
        codolio?: string;
        externalRatings?: Record<string, unknown>;
    };
    placementApplications: Array<{
        id: string;
        company: string;
        role: string;
        driveStatus: string;
        driveDate: string;
        driveType: string;
        applicationStatus: string;
        stage?: string;
        stageNumber: number;
        totalStages: number;
        appliedAt: string;
    }>;
    companiesApplied: string[];
    courseEnrollments: Array<{
        courseId: string;
        courseTitle: string;
        status: string;
        enrolledAt: string;
        totalItems: number;
        completedItems: number;
        completionPercentage: number;
    }>;
    contests: Array<{
        title: string;
        startTime: string;
        endTime: string;
        score: number;
        joinedAt: string;
    }>;
    hackathons: Array<{
        title: string;
        startTime: string;
        endTime: string;
        score: number;
        joinedAt: string;
    }>;
    assessments?: Array<{
        title: string;
        startTime: string;
        endTime: string;
        score: number;
        joinedAt: string;
        completed: boolean;
        roundScores: Array<{ type: string; score: number; maxScore: number | null; adaptive: boolean; highestLevel: number | null }>;
    }>;
}

interface StudentProfileModalProps {
    studentId: string | null;
    onClose: () => void;
}

export default function StudentProfileModal({ studentId, onClose }: StudentProfileModalProps) {
    const [student, setStudent] = useState<StudentDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        if (!studentId) {
            setStudent(null);
            return;
        }
        setLoading(true);
        setActiveTab("overview");
        fetch(`/api/coordinator/students/${studentId}`)
            .then((res) => res.json())
            .then((data) => setStudent(data.student || null))
            .catch(() => setStudent(null))
            .finally(() => setLoading(false));
    }, [studentId]);

    if (!studentId) return null;

    const tabs = [
        { key: "overview", label: "Overview" },
        { key: "placement", label: "Placement" },
        { key: "academics", label: "Academics" },
        { key: "competitions", label: "Competitions" },
        { key: "profile", label: "Profile Details" },
    ];

    const initials = student?.name
        ? student.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : "??";

    const statusColors: Record<string, string> = {
        APPLIED: "bg-blue-50 text-blue-600 border-blue-200",
        SHORTLISTED: "bg-green-50 text-green-600 border-green-200",
        INTERVIEW: "bg-amber-50 text-amber-600 border-amber-200",
        PLACED: "bg-emerald-50 text-emerald-700 border-emerald-200",
        REJECTED: "bg-red-50 text-red-500 border-red-200",
        WITHDRAWN: "bg-gray-50 text-gray-500 border-gray-200",
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl overflow-y-auto bg-white shadow-2xl animate-slide-in">
                {/* Loading State */}
                {loading ? (
                    <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : !student ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3">
                        <p className="text-sm text-gray-500">Could not load student data.</p>
                        <button onClick={onClose} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                            Close
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-5">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-bold text-white shadow-lg shadow-blue-200">
                                        {initials}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{student.name}</h2>
                                        <div className="mt-0.5 flex items-center gap-3 text-sm text-gray-500">
                                            <span>{student.profile?.department || "No Department"}</span>
                                            <span className="h-1 w-1 rounded-full bg-gray-300" />
                                            <span>{student.profile?.batch || "No Batch"}</span>
                                        </div>
                                        {student.profile?.cgpa && (
                                            <span className={`mt-1.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                                student.profile.cgpa >= 8
                                                    ? "bg-green-50 text-green-600"
                                                    : student.profile.cgpa >= 6
                                                    ? "bg-blue-50 text-blue-600"
                                                    : "bg-orange-50 text-orange-600"
                                            }`}>
                                                CGPA: {student.profile.cgpa.toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="mt-5 flex items-center gap-1">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                            activeTab === tab.key
                                                ? "bg-blue-600 text-white"
                                                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {/* ========= OVERVIEW TAB ========= */}
                            {activeTab === "overview" && (
                                <div className="space-y-6">
                                    {/* Quick Stats Grid */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <StatCard
                                            icon={<Clock className="h-4 w-4 text-blue-600" />}
                                            label="Today's Learning"
                                            value={`${student.stats.todayLearningHours}h`}
                                            bgColor="bg-blue-50"
                                        />
                                        <StatCard
                                            icon={<BookOpen className="h-4 w-4 text-indigo-600" />}
                                            label="Total Learning"
                                            value={`${student.stats.totalLearningHours}h`}
                                            bgColor="bg-indigo-50"
                                        />
                                        <StatCard
                                            icon={<Code2 className="h-4 w-4 text-green-600" />}
                                            label="Problems Solved"
                                            value={student.stats.problemsSolved.toString()}
                                            bgColor="bg-green-50"
                                        />
                                        <StatCard
                                            icon={<Trophy className="h-4 w-4 text-amber-600" />}
                                            label="Contests"
                                            value={student.stats.contestsParticipated.toString()}
                                            bgColor="bg-amber-50"
                                        />
                                        <StatCard
                                            icon={<Zap className="h-4 w-4 text-purple-600" />}
                                            label="Hackathons"
                                            value={student.stats.hackathonsParticipated.toString()}
                                            bgColor="bg-purple-50"
                                        />
                                        <StatCard
                                            icon={<Flame className="h-4 w-4 text-red-500" />}
                                            label="Current Streak"
                                            value={`${student.stats.currentStreak}d`}
                                            bgColor="bg-red-50"
                                        />
                                    </div>

                                    {/* Today's Activity Summary */}
                                    <div className="rounded-xl border border-gray-200 p-4">
                                        <h3 className="mb-3 text-sm font-bold text-gray-900">Today&apos;s Activity</h3>
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                                <span className="text-xs text-gray-500">Submissions: <strong className="text-gray-900">{student.stats.todaySubmissions}</strong></span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                                <span className="text-xs text-gray-500">Items Completed: <strong className="text-gray-900">{student.stats.todayCompletedItems}</strong></span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-indigo-500" />
                                                <span className="text-xs text-gray-500">Learning: <strong className="text-gray-900">{student.stats.todayLearningHours}h</strong></span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Placement Summary */}
                                    <div className="rounded-xl border border-gray-200 p-4">
                                        <h3 className="mb-3 text-sm font-bold text-gray-900">Placement Summary</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                                                    <Building2 className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-lg font-bold text-gray-900">{student.stats.companiesApplied}</p>
                                                    <p className="text-[10px] text-gray-500">Companies Applied</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
                                                    <Target className="h-4 w-4 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="text-lg font-bold text-gray-900">
                                                        {student.placementApplications.filter(a => a.applicationStatus === "PLACED").length}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500">Offers Received</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* External Platforms */}
                                    {(student.externalPlatforms.leetcode || student.externalPlatforms.codolio) && (
                                        <div className="rounded-xl border border-gray-200 p-4">
                                            <h3 className="mb-3 text-sm font-bold text-gray-900">External Platforms</h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                {student.externalPlatforms.leetcode && (
                                                    <PlatformTag name="LeetCode" username={student.externalPlatforms.leetcode} color="bg-yellow-50 text-yellow-700" />
                                                )}
                                                {student.externalPlatforms.codolio && (
                                                    <PlatformTag name="Codolio" username={student.externalPlatforms.codolio} color="bg-purple-50 text-purple-700" />
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ========= PLACEMENT TAB ========= */}
                            {activeTab === "placement" && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-900">
                                        Placement Applications ({student.placementApplications.length})
                                    </h3>
                                    {student.placementApplications.length === 0 ? (
                                        <div className="rounded-xl border border-gray-200 py-10 text-center text-sm text-gray-400">
                                            No placement applications yet.
                                        </div>
                                    ) : (
                                        student.placementApplications.map((app) => (
                                            <div key={app.id} className="rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold text-gray-600">
                                                            {app.company.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">{app.company}</p>
                                                            <p className="text-xs text-gray-500">{app.role}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusColors[app.applicationStatus] || "bg-gray-100 text-gray-500 border-gray-200"}`}>
                                                        {app.applicationStatus}
                                                    </span>
                                                </div>
                                                {/* Progress bar */}
                                                <div className="mt-3">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[10px] text-gray-400">{app.stage || `Stage ${app.stageNumber} of ${app.totalStages}`}</span>
                                                        <span className="text-[10px] text-gray-400">{app.driveType === "ON_CAMPUS" ? "On-Campus" : "Off-Campus"}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full rounded-full bg-gray-100">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${
                                                                app.applicationStatus === "PLACED" ? "bg-emerald-500" :
                                                                app.applicationStatus === "REJECTED" ? "bg-red-400" :
                                                                "bg-blue-500"
                                                            }`}
                                                            style={{ width: `${Math.min((app.stageNumber / app.totalStages) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="mt-2 flex items-center gap-4 text-[10px] text-gray-400">
                                                    <span>Applied: {new Date(app.appliedAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}</span>
                                                    <span>Drive: {new Date(app.driveDate).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}

                                    {/* Companies Applied List */}
                                    {student.companiesApplied.length > 0 && (
                                        <div className="rounded-xl border border-gray-200 p-4">
                                            <h3 className="mb-3 text-sm font-bold text-gray-900">Companies Applied</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {student.companiesApplied.map((company) => (
                                                    <span key={company} className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700">
                                                        {company}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ========= ACADEMICS TAB ========= */}
                            {activeTab === "academics" && (
                                <div className="space-y-4">
                                    {/* Course Enrollments */}
                                    <h3 className="text-sm font-bold text-gray-900">
                                        Course Enrollments ({student.courseEnrollments.length})
                                    </h3>
                                    {student.courseEnrollments.length === 0 ? (
                                        <div className="rounded-xl border border-gray-200 py-10 text-center text-sm text-gray-400">
                                            No course enrollments.
                                        </div>
                                    ) : (
                                        student.courseEnrollments.map((course) => (
                                            <div key={course.courseId} className="rounded-xl border border-gray-200 p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                                                            <GraduationCap className="h-4 w-4 text-indigo-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">{course.courseTitle}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {course.completedItems}/{course.totalItems} items completed
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                                                        course.status === "COMPLETED" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                                                    }`}>
                                                        {course.status === "COMPLETED" ? "Completed" : "Active"}
                                                    </span>
                                                </div>
                                                <div className="mt-3">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[10px] text-gray-400">Progress</span>
                                                        <span className="text-[10px] font-semibold text-gray-600">{course.completionPercentage}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full rounded-full bg-gray-100">
                                                        <div
                                                            className="h-full rounded-full bg-indigo-500 transition-all"
                                                            style={{ width: `${course.completionPercentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}

                                    {/* Problems Solved Breakdown */}
                                    <div className="rounded-xl border border-gray-200 p-4">
                                        <h3 className="mb-3 text-sm font-bold text-gray-900">Problems Solved Breakdown</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="rounded-lg bg-green-50 p-3 text-center">
                                                <p className="text-2xl font-bold text-green-600">{student.stats.internalProblemsSolved}</p>
                                                <p className="text-[10px] text-green-600/70">Internal Problems</p>
                                            </div>
                                            <div className="rounded-lg bg-blue-50 p-3 text-center">
                                                <p className="text-2xl font-bold text-blue-600">{student.stats.externalProblemsSolved}</p>
                                                <p className="text-[10px] text-blue-600/70">External Problems</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ========= COMPETITIONS TAB ========= */}
                            {activeTab === "competitions" && (
                                <div className="space-y-6">
                                    {/* Assessments */}
                                    <div>
                                        <h3 className="mb-3 text-sm font-bold text-gray-900">
                                            Assessments Taken ({student.assessments?.length || 0})
                                        </h3>
                                        {!student.assessments || student.assessments.length === 0 ? (
                                            <div className="rounded-xl border border-gray-200 py-8 text-center text-sm text-gray-400">
                                                No assessments taken yet.
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {student.assessments.map((assessment, i) => (
                                                    <div key={i} className="rounded-lg border border-gray-200 p-3 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                                                                    <Target className="h-4 w-4 text-blue-600" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-900">{assessment.title}</p>
                                                                    <p className="text-[10px] text-gray-400">
                                                                        {new Date(assessment.startTime).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                                                                        {!assessment.completed && " • Did not submit"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
                                                                Score: {assessment.score}
                                                            </span>
                                                        </div>
                                                        {assessment.roundScores.length > 0 && (
                                                            <div className="flex flex-wrap gap-1.5 pl-11">
                                                                {assessment.roundScores.map((round, rIdx) => (
                                                                    <span key={rIdx} className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                                                                        round.type === "mcq" ? "bg-pink-50 text-pink-600" :
                                                                        round.type === "coding" ? "bg-indigo-50 text-indigo-600" :
                                                                        round.type === "debug" ? "bg-orange-50 text-orange-600" :
                                                                        round.type === "output" ? "bg-cyan-50 text-cyan-600" :
                                                                        round.type === "sql" ? "bg-violet-50 text-violet-600" :
                                                                        round.type === "email" ? "bg-amber-50 text-amber-600" :
                                                                        "bg-green-50 text-green-600"
                                                                    }`}>
                                                                        {round.type === "mcq" ? "MCQ" :
                                                                         round.type === "coding" ? "Coding" :
                                                                         round.type === "debug" ? "Debug" :
                                                                         round.type === "output" ? "Output" :
                                                                         round.type === "sql" ? "SQL" :
                                                                         round.type === "email" ? "Email (AI)" :
                                                                         "Voice (AI)"}: {round.score}{round.maxScore !== null ? `/${round.maxScore}` : ""}
                                                                        {round.adaptive && round.highestLevel !== null && (
                                                                            <span className="ml-1 font-bold">• Adaptive, peak L{round.highestLevel}/10</span>
                                                                        )}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Contests */}
                                    <div>
                                        <h3 className="mb-3 text-sm font-bold text-gray-900">
                                            Contests Participated ({student.contests.length})
                                        </h3>
                                        {student.contests.length === 0 ? (
                                            <div className="rounded-xl border border-gray-200 py-8 text-center text-sm text-gray-400">
                                                No contests participated yet.
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {student.contests.map((contest, i) => (
                                                    <div key={i} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                                                                <Trophy className="h-4 w-4 text-amber-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">{contest.title}</p>
                                                                <p className="text-[10px] text-gray-400">
                                                                    {new Date(contest.startTime).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
                                                            Score: {contest.score}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Hackathons */}
                                    <div>
                                        <h3 className="mb-3 text-sm font-bold text-gray-900">
                                            Hackathons Participated ({student.hackathons.length})
                                        </h3>
                                        {student.hackathons.length === 0 ? (
                                            <div className="rounded-xl border border-gray-200 py-8 text-center text-sm text-gray-400">
                                                No hackathons participated yet.
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {student.hackathons.map((hack, i) => (
                                                    <div key={i} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
                                                                <Zap className="h-4 w-4 text-purple-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">{hack.title}</p>
                                                                <p className="text-[10px] text-gray-400">
                                                                    {new Date(hack.startTime).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-600">
                                                            Score: {hack.score}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ========= PROFILE DETAILS TAB ========= */}
                            {activeTab === "profile" && (
                                <div className="space-y-4">
                                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                                        <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-2.5">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Personal Information</h3>
                                        </div>
                                        <div className="divide-y divide-gray-50">
                                            <DetailRow icon={<User className="h-4 w-4" />} label="Full Name" value={student.name || "—"} />
                                            <DetailRow icon={<Mail className="h-4 w-4" />} label="Email" value={student.email} />
                                            <DetailRow icon={<Phone className="h-4 w-4" />} label="Phone" value={student.phone || "—"} />
                                            <DetailRow icon={<User className="h-4 w-4" />} label="Father's Name" value={student.profile?.fatherName || "—"} />
                                            <DetailRow icon={<Calendar className="h-4 w-4" />} label="Joined" value={new Date(student.createdAt).toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" })} />
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                                        <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-2.5">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Academic Information</h3>
                                        </div>
                                        <div className="divide-y divide-gray-50">
                                            <DetailRow icon={<GraduationCap className="h-4 w-4" />} label="Degree" value={student.profile?.degree || "—"} />
                                            <DetailRow icon={<Building2 className="h-4 w-4" />} label="Department" value={student.profile?.department || "—"} />
                                            <DetailRow icon={<Calendar className="h-4 w-4" />} label="Batch" value={student.profile?.batch || "—"} />
                                            <DetailRow icon={<Award className="h-4 w-4" />} label="CGPA" value={student.profile?.cgpa?.toFixed(2) || "—"} />
                                            <DetailRow icon={<Award className="h-4 w-4" />} label="UG %" value={student.profile?.ugPercentage?.toFixed(1) || "—"} />
                                            <DetailRow icon={<Award className="h-4 w-4" />} label="PG %" value={student.profile?.pgPercentage?.toFixed(1) || "—"} />
                                        </div>
                                    </div>

                                    {/* Skills */}
                                    {student.profile?.skills && (
                                        <div className="rounded-xl border border-gray-200 p-4">
                                            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Skills</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {student.profile.skills.split(",").map((skill) => (
                                                    <span key={skill.trim()} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                                                        {skill.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Resume */}
                                    {student.profile?.resumeUrl && (
                                        <div className="rounded-xl border border-gray-200 p-4">
                                            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Resume</h3>
                                            <a
                                                href={student.profile.resumeUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                                            >
                                                <FileText className="h-5 w-5 text-blue-600" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900">{student.profile.resumeName || "Resume"}</p>
                                                    <p className="text-[10px] text-gray-400">Click to download</p>
                                                </div>
                                                <Download className="h-4 w-4 text-gray-400" />
                                            </a>
                                        </div>
                                    )}

                                    {/* Wallet & Streak */}
                                    <div className="rounded-xl border border-gray-200 p-4">
                                        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Platform Stats</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="rounded-lg bg-amber-50 p-3 text-center">
                                                <p className="text-2xl font-bold text-amber-600">{student.stats.walletBalance}</p>
                                                <p className="text-[10px] text-amber-600/70">Wallet Balance</p>
                                            </div>
                                            <div className="rounded-lg bg-red-50 p-3 text-center">
                                                <p className="text-2xl font-bold text-red-500">{student.stats.currentStreak}</p>
                                                <p className="text-[10px] text-red-500/70">Day Streak</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Slide-in animation */}
            <style jsx global>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in {
                    animation: slideIn 0.3s ease-out;
                }
            `}</style>
        </>
    );
}

// Stat Card sub-component
function StatCard({ icon, label, value, bgColor }: { icon: React.ReactNode; label: string; value: string; bgColor: string }) {
    return (
        <div className="rounded-xl border border-gray-200 p-3.5">
            <div className="flex items-center gap-2 mb-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${bgColor}`}>
                    {icon}
                </div>
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-[10px] text-gray-500">{label}</p>
        </div>
    );
}

// Platform Tag sub-component
function PlatformTag({ name, username, color }: { name: string; username: string; color: string }) {
    return (
        <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${color}`}>
            <ExternalLink className="h-3.5 w-3.5" />
            <div>
                <p className="text-[10px] font-semibold">{name}</p>
                <p className="text-xs">{username}</p>
            </div>
        </div>
    );
}

// Detail Row sub-component
function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
                <span className="text-gray-400">{icon}</span>
                <span className="text-sm text-gray-500">{label}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">{value}</span>
        </div>
    );
}
