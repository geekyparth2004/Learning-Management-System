"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    FileText,
    Building2,
    Users,
    User,
    HelpCircle,
    LogOut,
    Zap,
} from "lucide-react";

interface PlacementSidebarProps {
    orgName: string;
    userName: string;
    userDepartment?: string;
    userBatch?: string;
}

const navItems = [
    { label: "Dashboard", href: "/placement", icon: LayoutDashboard },
    { label: "My Applications", href: "/placement/applications", icon: FileText },
    { label: "Opportunities", href: "/placement/opportunities", icon: Building2 },
    { label: "Groups", href: "/placement/groups", icon: Users },
    { label: "Profile", href: "/placement/profile", icon: User },
];

export default function PlacementSidebar({
    orgName,
    userName,
    userDepartment,
    userBatch,
}: PlacementSidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="flex h-full w-64 flex-col border-r border-gray-800 bg-[#0a0a0a]">
            {/* Brand */}
            <div className="px-6 py-6">
                <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-xl font-bold tracking-tight text-transparent">
                    {orgName}
                </span>
            </div>

            {/* User Info */}
            <div className="mx-4 mb-6 flex items-center gap-3 rounded-xl border border-gray-800 bg-[#111] p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-sm font-bold text-white">
                    {userName?.charAt(0)?.toUpperCase() || "S"}
                </div>
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{userName}</p>
                    <p className="truncate text-xs text-gray-500">
                        {userDepartment || "Student"}{userBatch ? `, ${userBatch}` : ""}
                    </p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                                isActive
                                    ? "bg-teal-500/10 text-teal-400"
                                    : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                            }`}
                        >
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Quick Apply Button */}
            <div className="px-4 pb-4">
                <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition-all hover:shadow-teal-500/40 hover:scale-[1.02] active:scale-[0.98]">
                    <Zap className="h-4 w-4" />
                    Quick Apply
                </button>
            </div>

            {/* Bottom Links */}
            <div className="border-t border-gray-800 px-3 py-4 space-y-1">
                <Link
                    href="/placement/help"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-800/50 hover:text-gray-300 transition-colors"
                >
                    <HelpCircle className="h-4 w-4" />
                    Help Center
                </Link>
                <form action="/api/auth/signout" method="POST">
                    <Link
                        href="/"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-red-900/20 hover:text-red-400 transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </Link>
                </form>
            </div>
        </aside>
    );
}
