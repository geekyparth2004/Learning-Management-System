import React from "react";

interface HoursStatCardProps {
    totalHours: string | number;
    todayHours: string | number;
    className?: string;
}

export default function HoursStatCard({ totalHours, todayHours, className = "" }: HoursStatCardProps) {
    return (
        <div className={`flex overflow-hidden rounded-xl border border-gray-800 bg-[#161616] ${className}`}>
            {/* 2/3 Part - Lifetime */}
            <div className="flex w-2/3 flex-col justify-between border-r border-gray-800 p-6">
                <h3 className="text-sm font-medium text-gray-400">Total Hours Learned</h3>
                <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{totalHours}</span>
                    <span className="text-lg text-gray-500">hrs</span>
                </div>
            </div>

            {/* 1/3 Part - Today */}
            <div className="flex w-1/3 flex-col justify-between bg-white/5 p-6">
                <h3 className="text-xs font-medium text-gray-400">Today</h3>
                <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-white">{todayHours}</span>
                    <span className="text-sm text-gray-500">hrs</span>
                </div>
            </div>
        </div>
    );
}
