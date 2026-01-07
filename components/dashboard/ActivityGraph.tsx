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
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-400">Activity</h3>
                    <a href="/events" className="text-gray-500 hover:text-blue-400 transition-colors" title="Event Calendar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar">
                            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                            <line x1="16" x2="16" y1="2" y2="6" />
                            <line x1="8" x2="8" y1="2" y2="6" />
                            <line x1="3" x2="21" y1="10" y2="10" />
                        </svg>
                    </a>
                </div>
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
