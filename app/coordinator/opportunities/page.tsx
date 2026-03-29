"use client";

import React from "react";
import { Bell, Search, Plus, LogOut } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import OpportunitiesTable from "@/components/coordinator/OpportunitiesTable";

export default function OpportunitiesPage() {
    return (
        <div className="min-h-screen">
            {/* Top Bar */}
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
                <div className="flex items-center gap-6">
                    <Link href="/coordinator" className="text-sm text-gray-500 hover:text-gray-700">Dashboard</Link>
                    <span className="text-sm font-semibold text-blue-600">Opportunities</span>
                    <Link href="/coordinator/students" className="text-sm text-gray-500 hover:text-gray-700">Students</Link>
                    <Link href="/coordinator/reports" className="text-sm text-gray-500 hover:text-gray-700">Reports</Link>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search opportunities..."
                            className="w-56 rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                        />
                    </div>
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

            <main className="p-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Manage Opportunities</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Track recruitment drives, monitor applications, and manage hiring statuses.
                        </p>
                    </div>
                    <Link
                        href="/coordinator"
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Post New Opportunity
                    </Link>
                </div>

                <OpportunitiesTable />
            </main>
        </div>
    );
}
