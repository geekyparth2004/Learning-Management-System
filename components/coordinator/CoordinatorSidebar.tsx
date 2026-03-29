"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Briefcase,
    Users,
    MessageSquare,
    BarChart3,
    LogOut,
} from "lucide-react";

interface CoordinatorSidebarProps {
    orgName: string;
    userName: string;
    userTitle?: string;
}

const navItems = [
    { label: "Dashboard", href: "/coordinator", icon: LayoutDashboard },
    { label: "Opportunities", href: "/coordinator/opportunities", icon: Briefcase },
    { label: "Students", href: "/coordinator/students", icon: Users },
    { label: "Groups", href: "/coordinator/groups", icon: MessageSquare },
    { label: "Reports", href: "/coordinator/reports", icon: BarChart3 },
];

export default function CoordinatorSidebar({
    orgName,
    userName,
    userTitle,
}: CoordinatorSidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="flex h-full w-56 flex-col bg-white border-r border-gray-200">
            {/* Brand */}
            <div className="flex items-center gap-2.5 px-5 py-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                    <Briefcase className="h-4 w-4 text-white" />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-900 leading-tight">Placement Portal</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-0.5 px-3 mt-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== "/coordinator" && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                                isActive
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                        >
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>


            {/* User Info */}
            <div className="border-t border-gray-200 px-4 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700">
                        {userName?.charAt(0)?.toUpperCase() || "C"}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{userName}</p>
                        <p className="truncate text-xs text-gray-500">{userTitle || "Coordinator"}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
