"use client";

import React from "react";
import { Clock, Database, Brain, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisResult {
    timeComplexity: string;
    spaceComplexity: string;
    reason: string;
    suggestion: string;
}

interface ComplexityAnalysisProps {
    analysis: AnalysisResult | null;
    loading: boolean;
}

export default function ComplexityAnalysis({ analysis, loading }: ComplexityAnalysisProps) {
    return (
        <div className="rounded-lg border border-gray-800 bg-[#161616] p-4">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-400">
                    <Brain className="h-5 w-5" />
                    <h3 className="font-semibold">AI Complexity Analysis</h3>
                </div>
                {loading && (
                    <div className="flex items-center gap-2 rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Analyzing...</span>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-400">Time Complexity:</span>
                        <span className="rounded-full border border-gray-700 bg-[#1e1e1e] px-3 py-0.5 text-sm font-mono font-bold text-white">
                            {analysis?.timeComplexity || "-"}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-400">Space Complexity:</span>
                        <span className="rounded-full border border-gray-700 bg-[#1e1e1e] px-3 py-0.5 text-sm font-mono font-bold text-white">
                            {analysis?.spaceComplexity || "-"}
                        </span>
                    </div>
                </div>

                <div className="space-y-3 border-t border-gray-800 pt-3">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Why?</span>
                        <p className="mt-1 text-sm leading-relaxed text-gray-300">
                            {analysis?.reason || "Waiting for code analysis..."}
                        </p>
                    </div>
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Suggestion</span>
                        <p className="mt-1 text-sm leading-relaxed text-gray-400">
                            {analysis?.suggestion || "Start typing to get AI analysis..."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
