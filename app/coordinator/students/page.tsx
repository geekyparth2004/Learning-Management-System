"use client";

import React from "react";
import { Bell, Search, UserPlus } from "lucide-react";
import StudentsTable from "@/components/coordinator/StudentsTable";

export default function StudentsPage() {
    return (
        <div className="min-h-screen">
            {/* Top Bar */}
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
                <h1 className="text-lg font-bold text-gray-900">Student Directory</h1>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search students or jobs..."
                            className="w-56 rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                        />
                    </div>
                    <button className="relative rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50">
                        <Bell className="h-4 w-4" />
                    </button>
                    <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
                        <UserPlus className="h-4 w-4" />
                        Add New Student
                    </button>
                </div>
            </header>

            <main className="p-8">
                <StudentsTable />
            </main>
        </div>
    );
}
