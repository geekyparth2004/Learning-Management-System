"use client";

import React from "react";
import Link from "next/link";
import { Plus, Edit, Eye, Trash2, Clock, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";

interface Course {
    id: string;
    title: string;
    description: string | null;
    modules: { timeLimit: number }[];
}

export default function CourseList({ courses }: { courses: Course[] }) {
    const router = useRouter();

    const handleDelete = async (courseId: string) => {
        if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;

        try {
            const res = await fetch(`/api/courses/${courseId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                router.refresh();
            } else {
                alert("Failed to delete course");
            }
        } catch (error) {
            console.error(error);
            alert("Error deleting course");
        }
    };

    return (
        <div className="min-h-screen bg-[#0e0e0e] text-white p-8">
            <div className="mx-auto max-w-6xl">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">My Courses</h1>
                        <p className="text-gray-400">Manage and edit your courses</p>
                    </div>
                    <Link
                        href="/teacher/courses/create"
                        className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 font-bold hover:bg-blue-700"
                    >
                        <Plus size={20} />
                        Create New Course
                    </Link>
                </div>

                {courses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-800 bg-[#111111] p-12 text-center">
                        <div className="mb-4 rounded-full bg-gray-800 p-4 text-gray-400">
                            <BookOpen size={32} />
                        </div>
                        <h3 className="mb-2 text-xl font-bold">No Courses Yet</h3>
                        <p className="mb-6 text-gray-400">Start by creating your first course.</p>
                        <Link
                            href="/teacher/courses/create"
                            className="rounded bg-blue-600 px-6 py-2 font-bold hover:bg-blue-700"
                        >
                            Create Course
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {courses.map((course) => (
                            <div key={course.id} className="group overflow-hidden rounded-xl border border-gray-800 bg-[#111111] transition-all hover:border-gray-700">
                                <div className="p-6">
                                    <div className="mb-2 flex items-start justify-between">
                                        <h3 className="text-xl font-bold line-clamp-1">{course.title}</h3>
                                        <button
                                            onClick={() => handleDelete(course.id)}
                                            className="text-gray-500 hover:text-red-500"
                                            title="Delete Course"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <p className="mb-4 text-sm text-gray-400 line-clamp-2">{course.description}</p>

                                    <div className="mb-6 flex items-center gap-4 text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <BookOpen size={14} />
                                            <span>{courses.length} Modules</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock size={14} />
                                            <span>
                                                {Math.round(course.modules.reduce((acc, m) => acc + m.timeLimit, 0) / 60)}h Total
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Link
                                            href={`/teacher/courses/${course.id}/builder`}
                                            className="flex flex-1 items-center justify-center gap-2 rounded bg-gray-800 py-2 text-sm font-medium hover:bg-gray-700 hover:text-white"
                                        >
                                            <Edit size={16} />
                                            Edit
                                        </Link>
                                        <Link
                                            href={`/courses/${course.id}`}
                                            className="flex items-center justify-center rounded border border-gray-700 p-2 text-gray-400 hover:border-gray-500 hover:text-white"
                                            title="View as Student"
                                        >
                                            <Eye size={16} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
