import React from "react";

export function StatsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {/* Column 1 */}
            <div className="flex flex-col gap-6">
                <div className="h-40 rounded-xl bg-gray-800/50"></div>
                <div className="h-64 rounded-xl bg-gray-800/50"></div>
                <div className="h-32 rounded-xl bg-gray-800/50"></div>
            </div>
            {/* Column 2 */}
            <div className="flex flex-col gap-6">
                <div className="h-32 rounded-xl bg-gray-800/50"></div>
                <div className="h-48 rounded-xl bg-gray-800/50"></div>
            </div>
            {/* Column 3 */}
            <div className="flex flex-col gap-6">
                <div className="h-96 rounded-xl bg-gray-800/50"></div>
            </div>
        </div>
    );
}

export function ChartsSkeleton() {
    return (
        <div className="flex flex-col gap-6 animate-pulse">
            <div className="h-64 w-full rounded-xl bg-gray-800/50"></div>
        </div>
    );
}

export function RecentActivitySkeleton() {
    return (
        <div className="flex flex-col gap-4 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-gray-800/30">
                    <div className="h-10 w-10 rounded-full bg-gray-700"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-gray-700"></div>
                        <div className="h-3 w-1/2 rounded bg-gray-700/50"></div>
                    </div>
                </div>
            ))}
        </div>
    );
}
