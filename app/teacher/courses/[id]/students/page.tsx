"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Users, Search } from "lucide-react";
import Link from "next/link";

interface Student {
    id: string;
    name: string;
    email: string;
    image?: string;
    enrolledAt: string;
    progressPercentage: number;
    completedModules: number;
    totalModules: number;
}

export default function StudentsPage() {
    const params = useParams();
    const courseId = params.id as string;

    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchStudents();
    }, [courseId]);

    const fetchStudents = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/courses/${courseId}/students`);
            if (res.ok) {
                const data = await res.json();
                setStudents(data.students);
            }
        } catch (error) {
            console.error("Failed to fetch students", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredStudents = students.filter(student =>
        student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0e0e0e] text-white">
                Loading...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0e0e0e] text-white">
            <header className="border-b border-gray-800 bg-[#161616] px-6 py-4">
                <div className="mx-auto flex max-w-6xl items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/teacher/courses/${courseId}/builder`}
                            className="text-gray-400 hover:text-white"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold">Enrolled Students</h1>
                            <p className="text-sm text-gray-400">
                                {students.length} student{students.length !== 1 ? "s" : ""} enrolled
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-6xl p-6">
                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-gray-800 bg-[#111111] py-2 pl-10 pr-4 text-sm focus:border-blue-600 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Students Grid */}
                {filteredStudents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-gray-800 bg-[#111111] p-12 text-center">
                        <Users size={48} className="mb-4 text-gray-600" />
                        <p className="text-gray-400">
                            {searchQuery ? "No students found matching your search" : "No students enrolled yet"}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredStudents.map((student) => (
                            <Link
                                key={student.id}
                                href={`/teacher/courses/${courseId}/students/${student.id}`}
                                className="group block rounded-lg border border-gray-800 bg-[#111111] p-5 transition-all hover:border-blue-900 hover:bg-[#161616]"
                            >
                                <div className="mb-4 flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        {student.image ? (
                                            <img
                                                src={student.image}
                                                alt={student.name || "Student"}
                                                className="h-12 w-12 rounded-full"
                                            />
                                        ) : (
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-900/30 text-lg font-bold text-blue-400">
                                                {(student.name || student.email)?.[0]?.toUpperCase()}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="truncate font-semibold group-hover:text-blue-400">
                                                {student.name || "Unknown"}
                                            </h3>
                                            <p className="truncate text-xs text-gray-500">{student.email}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">Progress</span>
                                        <span className="font-semibold text-blue-400">
                                            {student.progressPercentage}%
                                        </span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                                        <div
                                            className="h-full bg-blue-600 transition-all"
                                            style={{ width: `${student.progressPercentage}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>
                                            {student.completedModules} / {student.totalModules} modules
                                        </span>
                                        <span>
                                            Enrolled {new Date(student.enrolledAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
