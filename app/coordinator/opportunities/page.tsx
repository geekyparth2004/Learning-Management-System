"use client";

import React from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import OpportunitiesTable from "@/components/coordinator/OpportunitiesTable";
import CoordinatorTopBar from "@/components/coordinator/CoordinatorTopBar";

export default function OpportunitiesPage() {
    return (
        <div className="min-h-screen">
            <CoordinatorTopBar active="opportunities" searchPlaceholder="Search opportunities..." />

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
