import React from "react";
import Link from "next/link";
import { BookOpen, User } from "lucide-react";
import { db } from "@/lib/db";
import ServicesGrid from "@/components/ServicesGrid";
import StudentShell from "@/components/layout/StudentShell";

// Revalidate every hour
export const revalidate = 0;

export default async function CoursesPage() {
    const courses = await db.course.findMany({
        include: {
            teacher: { select: { name: true } },
            _count: { select: { modules: true, enrollments: true } }
        },
        orderBy: { createdAt: "desc" }
    });

    return (
        <StudentShell>
            <div className="min-h-[100dvh] bg-[#0e0e0e] text-white">
                <header className="sticky top-0 z-30 border-b border-gray-800 bg-[#161616]/80 px-4 py-4 backdrop-blur md:static md:bg-[#161616] md:px-6">
                    <div className="mx-auto flex max-w-5xl items-center justify-between">
                        <h1 className="text-xl font-bold">Available Courses</h1>
                        <Link href="/" className="text-sm text-gray-400 hover:text-white">
                            Back to Dashboard
                        </Link>
                    </div>
                </header>

                <main className="mx-auto max-w-5xl p-4 md:p-6">
                    <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {courses.map((course) => (
                            <Link
                                key={course.id}
                                href={`/courses/${course.id}`}
                                className="group block rounded-xl border border-gray-800 bg-[#111111] p-5 transition-colors hover:border-blue-900 hover:bg-[#161616]"
                            >
                                <h3 className="mb-2 text-lg font-semibold group-hover:text-blue-400">
                                    {course.title}
                                </h3>
                                <p className="mb-4 line-clamp-2 text-sm text-gray-400">
                                    {course.description}
                                </p>
                                <div className="flex items-center justify-between gap-3 text-xs text-gray-500">
                                    <div className="flex min-w-0 items-center gap-1">
                                        <User size={12} />
                                        <span className="truncate">{course.teacher?.name || "Unknown Teacher"}</span>
                                    </div>
                                    <div className="flex flex-shrink-0 items-center gap-1">
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

                <div className="mx-auto max-w-7xl px-4 pb-12 md:px-8">
                    <ServicesGrid />
                </div>
            </div>
        </StudentShell>
    );
}
