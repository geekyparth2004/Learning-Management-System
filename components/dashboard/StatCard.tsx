import React from "react";

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    className?: string;
}

export default function StatCard({ title, value, subtitle, className = "" }: StatCardProps) {
    return (
        <div className={`flex flex-col justify-between rounded-xl border border-gray-800 bg-[#161616] p-6 ${className}`}>
            <h3 className="text-sm font-medium text-gray-400">{title}</h3>
            <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">{value}</span>
                {subtitle && <span className="text-lg text-gray-500">{subtitle}</span>}
            </div>
        </div>
    );
}
