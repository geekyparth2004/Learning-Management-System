"use client";

import React from "react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";

interface ActivityGraphProps {
    data: { day: string; value: number }[];
    children?: React.ReactNode;
}

export default function ActivityGraph({ data, children }: ActivityGraphProps) {
    return (
        <div className="flex flex-col rounded-xl border border-gray-800 bg-[#161616] p-6">
            <div>
                <h3 className="mb-4 text-sm font-medium text-gray-400">Activity</h3>
                <div className="h-[120px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="day"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#6b7280", fontSize: 12 }}
                                dy={10}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
                                itemStyle={{ color: "#fff" }}
                                cursor={{ stroke: "#4b5563", strokeWidth: 1 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#8b5cf6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorActivity)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
            {children}
        </div>
    );
}
