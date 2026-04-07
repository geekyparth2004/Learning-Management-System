import TeacherNotifications from "@/components/TeacherNotifications";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ResponsiveShell from "@/components/layout/ResponsiveShell";
import TeacherSidebar from "@/components/teacher/TeacherSidebar";
import Link from "next/link";
import { LogOut } from "lucide-react";
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
        <ResponsiveShell
            wrapperClassName="bg-[#0e0e0e] text-white"
            headerTitle="Teacher Portal"
            headerRight={
                <div className="flex items-center gap-2">
                    <TeacherNotifications />
                    <Link
                        href="/api/auth/signout"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white/80 ring-1 ring-white/10 hover:bg-white/5 active:scale-[0.98]"
                        aria-label="Sign out"
                    >
                        <LogOut className="h-5 w-5" />
                    </Link>
                </div>
            }
            sidebar={
                <TeacherSidebar
                    name={session.user.name || "Teacher"}
                    email={session.user.email || ""}
                />
            }
            bottomNav={[
                { label: "Courses", href: "/teacher/courses", icon: "courses" },
                { label: "Students", href: "/teacher/students", icon: "users" },
                { label: "Doubts", href: "/teacher/doubts", icon: "doubts" },
                { label: "Contest", href: "/teacher/contest", icon: "contests" },
                { label: "More", href: "/teacher/analytics", icon: "dashboard" },
            ]}
            contentClassName="bg-[#0e0e0e]"
        >
            <div className="hidden md:flex sticky top-0 z-30 h-16 items-center justify-between border-b border-gray-800 bg-[#111111]/90 px-6 backdrop-blur">
                <div className="text-sm text-gray-400">Welcome back, {session.user.name}</div>
                <div className="flex items-center gap-4">
                    <TeacherNotifications />
                    <Link
                        href="/api/auth/signout"
                        className="p-2 text-gray-400 hover:text-white hover:bg-[#1e1e1e] rounded-full transition-colors"
                    >
                        <LogOut size={20} />
                    </Link>
                </div>
            </div>
            <main className="p-4 md:p-6">{children}</main>
        </ResponsiveShell>
    );
}
