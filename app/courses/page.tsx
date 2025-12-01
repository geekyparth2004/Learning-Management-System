"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, User } from "lucide-react";

interface Course {
    id: string;
    title: string;
    description: string;
    teacher: { name: string };
    _count: { modules: number; enrollments: number };
}

export default function CoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await fetch("/api/courses");
            if (!res.ok) throw new Error("Failed to fetch courses");
            const data = await res.json();
            setCourses(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0e0e0e] text-white">
            <header className="border-b border-gray-800 bg-[#161616] px-6 py-4">
                <div className="mx-auto flex max-w-5xl items-center justify-between">
                    <h1 className="text-xl font-bold">Available Courses</h1>
                    <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white">
                        Back to Dashboard
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-5xl p-6">
                {isLoading ? (
                    <div className="text-center text-gray-400">Loading courses...</div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {courses.map((course) => (
                            <Link
                                key={course.id}
                                href={`/courses/${course.id}`}
                                className="group block rounded-lg border border-gray-800 bg-[#111111] p-6 transition-colors hover:border-blue-900 hover:bg-[#161616]"
                            >
                                <h3 className="mb-2 text-lg font-semibold group-hover:text-blue-400">
                                    {course.title}
                                </h3>
                                <p className="mb-4 line-clamp-2 text-sm text-gray-400">
                                    {course.description}
                                </p>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <User size={12} />
                                        <span>{course.teacher?.name || "Unknown Teacher"}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <BookOpen size={12} />
                                        <span>{course._count.modules} Modules</span>
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
