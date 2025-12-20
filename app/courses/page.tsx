import React from "react";
import Link from "next/link";
import { BookOpen, User } from "lucide-react";
import { db } from "@/lib/db";

// Revalidate every hour
export const revalidate = 3600;

export default async function CoursesPage() {
    const courses = await db.course.findMany({
        include: {
            teacher: { select: { name: true } },
            _count: { select: { modules: true, enrollments: true } }
        },
        orderBy: { createdAt: "desc" }
    });

    return (
        <div className="min-h-screen bg-[#0e0e0e] text-white">
            <header className="border-b border-gray-800 bg-[#161616] px-6 py-4">
                <div className="mx-auto flex max-w-5xl items-center justify-between">
                    <h1 className="text-xl font-bold">Available Courses</h1>
                    <Link href="/" className="text-sm text-gray-400 hover:text-white">
                        Back to Dashboard
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-5xl p-6">
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
                    {courses.length === 0 && (
                        <p className="col-span-full text-center text-gray-500 italic">
                            No courses available at the moment.
                        </p>
                    )}
                </div>
            </main>
        </div>
    );
}
