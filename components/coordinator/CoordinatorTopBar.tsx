"use client";

import React from "react";
import Link from "next/link";
import { Bell, Search, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export type CoordinatorSection = "dashboard" | "opportunities" | "assessments" | "students" | "reports";

const LINKS: { key: CoordinatorSection; label: string; href: string }[] = [
    { key: "dashboard", label: "Dashboard", href: "/coordinator" },
    { key: "opportunities", label: "Opportunities", href: "/coordinator/opportunities" },
    { key: "assessments", label: "Assessments", href: "/coordinator/assessments" },
    { key: "students", label: "Students", href: "/coordinator/students" },
    { key: "reports", label: "Reports", href: "/coordinator/reports" },
];

interface CoordinatorTopBarProps {
    active: CoordinatorSection;
    searchPlaceholder?: string;
}

export default function CoordinatorTopBar({ active, searchPlaceholder }: CoordinatorTopBarProps) {
    return (
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
            <div className="flex items-center gap-6">
                {LINKS.map((link) =>
                    link.key === active ? (
                        <span key={link.key} className="text-sm font-semibold text-blue-600">{link.label}</span>
                    ) : (
                        <Link key={link.key} href={link.href} className="text-sm text-gray-500 hover:text-gray-700">
                            {link.label}
                        </Link>
                    )
                )}
            </div>
            <div className="flex items-center gap-4">
                {searchPlaceholder && (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            className="w-56 rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                        />
                    </div>
                )}
                <button className="relative rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50">
                    <Bell className="h-4 w-4" />
                </button>
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </button>
            </div>
        </header>
    );
}
