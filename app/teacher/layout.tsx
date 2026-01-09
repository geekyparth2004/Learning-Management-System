import TeacherNotifications from "@/components/TeacherNotifications";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, BookOpen, LogOut, MessageSquare, Trophy, Code } from "lucide-react";

export default async function TeacherLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user || session.user.role !== "TEACHER") {
        return redirect("/");
    }

    return (
        <div className="flex h-screen bg-[#0e0e0e] text-white">
            {/* Sidebar */}
            <aside className="w-64 border-r border-gray-800 bg-[#111111] flex flex-col">
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Teacher Portal
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link
                        href="/teacher/courses"
                        className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-[#1e1e1e] rounded-lg transition-colors"
                    >
                        <BookOpen size={20} />
                        <span>My Courses</span>
                    </Link>
                    <Link
                        href="/teacher/analytics"
                        className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-[#1e1e1e] rounded-lg transition-colors"
                    >
                        <LayoutDashboard size={20} />
                        <span>Analytics</span>
                    </Link>
                    <Link
                        href="/teacher/reviews"
                        className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-[#1e1e1e] rounded-lg transition-colors"
                    >
                        <MessageSquare size={20} />
                        <span>Reviews</span>
                    </Link>
                    <Link
                        href="/teacher/contest"
                        className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-[#1e1e1e] rounded-lg transition-colors"
                    >
                        <Trophy size={20} />
                        <span>Contests</span>
                    </Link>
                    <Link
                        href="/teacher/hackathon"
                        className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-[#1e1e1e] rounded-lg transition-colors"
                    >
                        <Code size={20} />
                        <span>Hackathons</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <div className="flex items-center gap-3 px-4 py-3 text-gray-400">
                        <div className="h-8 w-8 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 font-bold">
                            {session.user.name?.[0] || "T"}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="truncate text-sm font-medium text-white">{session.user.name}</p>
                            <p className="truncate text-xs text-gray-500">{session.user.email}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b border-gray-800 bg-[#111111] flex items-center justify-between px-6">
                    <div className="text-sm text-gray-400">
                        Welcome back, {session.user.name}
                    </div>
                    <div className="flex items-center gap-4">
                        <TeacherNotifications />
                        <Link
                            href="/api/auth/signout"
                            className="p-2 text-gray-400 hover:text-white hover:bg-[#1e1e1e] rounded-full transition-colors"
                        >
                            <LogOut size={20} />
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
