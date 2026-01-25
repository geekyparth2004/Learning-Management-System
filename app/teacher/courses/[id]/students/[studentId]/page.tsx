"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle, Clock, Lock, PlayCircle, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

interface ModuleItem {
    id: string;
    title: string;
    type: string;
    order: number;
    isCompleted: boolean;
    duration: number;
    reviewStatus: string | null;
    startedAt: string | null;
    completedAt: string | null;
}

interface Module {
    id: string;
    title: string;
    order: number;
    timeLimit: number;
    status: "LOCKED" | "IN_PROGRESS" | "COMPLETED";
    startedAt: string | null;
    completedAt: string | null;
    items: ModuleItem[];
}

interface StudentInfo {
    id: string;
    name: string;
    email: string;
    image?: string;
    enrolledAt: string;
}

export default function StudentProgressPage() {
    const params = useParams();
    const courseId = params.id as string;
    const studentId = params.studentId as string;

    const [student, setStudent] = useState<StudentInfo | null>(null);
    const [modules, setModules] = useState<Module[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchStudentProgress();
    }, [courseId, studentId]);

    const fetchStudentProgress = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/courses/${courseId}/students/${studentId}/progress`);
            if (res.ok) {
                const data = await res.json();
                setStudent(data.student);
                setModules(data.modules);
            }
        } catch (error) {
            console.error("Failed to fetch student progress", error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDuration = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    };

    const getModuleStatusColor = (status: string) => {
        switch (status) {
            case "COMPLETED":
                return "text-green-400 bg-green-900/20 border-green-900";
            case "IN_PROGRESS":
                return "text-blue-400 bg-blue-900/20 border-blue-900";
            case "LOCKED":
                return "text-gray-400 bg-gray-900/20 border-gray-800";
            default:
                return "text-gray-400 bg-gray-900/20 border-gray-800";
        }
    };

    const getModuleStatusIcon = (status: string) => {
        switch (status) {
            case "COMPLETED":
                return <CheckCircle size={16} />;
            case "IN_PROGRESS":
                return <PlayCircle size={16} />;
            case "LOCKED":
                return <Lock size={16} />;
            default:
                return <Clock size={16} />;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0e0e0e] text-white">
                Loading...
            </div>
        );
    }

    if (!student) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0e0e0e] text-white">
                Student not found
            </div>
        );
    }

    const totalItems = modules.reduce((sum, m) => sum + m.items.length, 0);
    const completedItems = modules.reduce(
        (sum, m) => sum + m.items.filter(i => i.isCompleted).length,
        0
    );
    const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return (
        <div className="min-h-screen bg-[#0e0e0e] text-white">
            <header className="border-b border-gray-800 bg-[#161616] px-6 py-4">
                <div className="mx-auto flex max-w-5xl items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/teacher/courses/${courseId}/students`}
                            className="text-gray-400 hover:text-white"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div className="flex items-center gap-3">
                            {student.image ? (
                                <img
                                    src={student.image}
                                    alt={student.name || "Student"}
                                    className="h-10 w-10 rounded-full"
                                />
                            ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-900/30 text-lg font-bold text-blue-400">
                                    {(student.name || student.email)?.[0]?.toUpperCase()}
                                </div>
                            )}
                            <div>
                                <h1 className="text-xl font-bold">{student.name || "Unknown"}</h1>
                                <p className="text-sm text-gray-400">{student.email}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-5xl p-6">
                {/* Overall Progress Card */}
                <div className="mb-6 rounded-lg border border-gray-800 bg-[#111111] p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold">Overall Progress</h2>
                        <span className="text-2xl font-bold text-blue-400">{overallProgress}%</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-gray-800 mb-3">
                        <div
                            className="h-full bg-blue-600 transition-all"
                            style={{ width: `${overallProgress}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>
                            {completedItems} / {totalItems} items completed
                        </span>
                        <span>
                            Enrolled {new Date(student.enrolledAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>

                {/* Modules List */}
                <div className="space-y-4">
                    {modules.map((module, index) => (
                        <div
                            key={module.id}
                            className="rounded-lg border border-gray-800 bg-[#111111] overflow-hidden"
                        >
                            <div className="flex items-center justify-between bg-[#161616] px-6 py-4 border-b border-gray-800">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-900/50 text-xs font-bold text-blue-400">
                                        {index + 1}
                                    </span>
                                    <h3 className="font-semibold">{module.title}</h3>
                                    <div className="flex items-center gap-1 rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                                        <Clock size={12} />
                                        <span>{Math.round(module.timeLimit / 60)}h limit</span>
                                    </div>
                                </div>
                                <div
                                    className={`flex items-center gap-2 rounded px-3 py-1 text-xs font-bold border ${getModuleStatusColor(
                                        module.status
                                    )}`}
                                >
                                    {getModuleStatusIcon(module.status)}
                                    {module.status.replace("_", " ")}
                                </div>
                            </div>

                            <div className="p-4 space-y-2">
                                {module.items.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-4">
                                        No items in this module
                                    </p>
                                ) : (
                                    module.items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between rounded border border-gray-800 bg-[#1e1e1e] p-3"
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                {item.isCompleted ? (
                                                    <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                                                ) : item.startedAt ? (
                                                    <PlayCircle size={18} className="text-blue-500 flex-shrink-0" />
                                                ) : (
                                                    <div className="h-4 w-4 rounded-full border-2 border-gray-700 flex-shrink-0" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{item.title}</p>
                                                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                        <span className="px-2 py-0.5 rounded bg-gray-800">
                                                            {item.type.replace("_", " ")}
                                                        </span>
                                                        {item.duration > 0 && (
                                                            <span>⏱️ {formatDuration(item.duration)}</span>
                                                        )}
                                                        {item.reviewStatus && (
                                                            <span
                                                                className={`px-2 py-0.5 rounded ${item.reviewStatus === "APPROVED"
                                                                        ? "bg-green-900/20 text-green-400"
                                                                        : item.reviewStatus === "REJECTED"
                                                                            ? "bg-red-900/20 text-red-400"
                                                                            : "bg-yellow-900/20 text-yellow-400"
                                                                    }`}
                                                            >
                                                                {item.reviewStatus}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
