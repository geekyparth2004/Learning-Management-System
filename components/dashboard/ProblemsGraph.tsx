"use client";

import React from "react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

import { LeaderboardModal } from "@/components/dashboard/LeaderboardModal";

interface ProblemsGraphProps {
    data: { day: string; value: number }[];
    totalSolved: number;
}

export default function ProblemsGraph({ data, totalSolved }: ProblemsGraphProps) {
    return (
        <div className="w-full rounded-xl border border-gray-800 bg-[#161616] p-6">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-400">Problems Solved</h3>
                <LeaderboardModal />
            </div>
            <div className="mt-2 text-4xl font-bold text-white">{totalSolved}</div>

            <div className="mt-8 h-[120px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#6b7280", fontSize: 12 }}
                            dy={10}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
                            itemStyle={{ color: "#fff" }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill="#6366f1" opacity={0.3 + (index * 0.1)} /> // Gradient effect by opacity? Or just purple
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
