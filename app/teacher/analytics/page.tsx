import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Users, BookOpen, BarChart } from "lucide-react";

export default async function AnalyticsPage() {
    const session = await auth();

    if (!session?.user || session.user.role !== "TEACHER") {
        return redirect("/");
    }

    const teacherId = session.user.id;

    // Fetch stats
    const courses = await db.course.findMany({
        where: { teacherId },
        include: {
            _count: {
                select: { enrollments: true }
            }
        }
    });

    const totalCourses = courses.length;
    const totalStudents = courses.reduce((acc, course) => acc + course._count.enrollments, 0);

    // Calculate average progress (mock calculation for now as it's complex)
    const averageProgress = 0;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-xl border border-gray-800 bg-[#161616] p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-400">Total Courses</h3>
                        <BookOpen className="text-blue-500" />
                    </div>
                    <p className="text-3xl font-bold">{totalCourses}</p>
                </div>

                <div className="rounded-xl border border-gray-800 bg-[#161616] p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-400">Total Students</h3>
                        <Users className="text-purple-500" />
                    </div>
                    <p className="text-3xl font-bold">{totalStudents}</p>
                </div>

                <div className="rounded-xl border border-gray-800 bg-[#161616] p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-400">Average Progress</h3>
                        <BarChart className="text-green-500" />
                    </div>
                    <p className="text-3xl font-bold">{averageProgress}%</p>
                    <p className="text-xs text-gray-500 mt-2">Across all courses</p>
                </div>
            </div>

            <div className="rounded-xl border border-gray-800 bg-[#161616] p-6">
                <h2 className="text-xl font-bold mb-4">Course Performance</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-800 text-gray-400">
                                <th className="pb-3">Course Name</th>
                                <th className="pb-3">Students</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {courses.map((course) => (
                                <tr key={course.id}>
                                    <td className="py-3">{course.title}</td>
                                    <td className="py-3">{course._count.enrollments}</td>
                                </tr>
                            ))}
                            {courses.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="py-4 text-center text-gray-500">
                                        No courses found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
