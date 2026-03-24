import React from "react";
import { Circle, CheckCircle2, Trophy, Eye } from "lucide-react";

interface Application {
    id: string;
    status: string;
    stage?: string;
    stageNumber: number;
    totalStages: number;
    drive: {
        company: string;
        role: string;
        companyLogo?: string;
    };
}

interface ActiveTrackingProps {
    applications: Application[];
}

export default function ActiveTracking({ applications }: ActiveTrackingProps) {
    // Filter only active applications (not rejected, withdrawn, or completed placement)
    const activeApps = applications.filter(
        (a) => !["REJECTED", "WITHDRAWN"].includes(a.status)
    );

    if (activeApps.length === 0) {
        return (
            <div className="rounded-2xl border border-gray-800 bg-[#111] p-6">
                <h3 className="mb-4 text-base font-bold text-white">Active Tracking</h3>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Eye className="mb-3 h-8 w-8 text-gray-600" />
                    <p className="text-sm text-gray-500">No active applications to track.</p>
                    <p className="mt-1 text-xs text-gray-600">Register for a drive to start tracking.</p>
                </div>
            </div>
        );
    }

    const statusConfig: Record<string, { color: string; border: string; label: string; bg: string }> = {
        APPLIED: { color: "text-blue-400", border: "border-blue-500/30", label: "APPLIED", bg: "bg-blue-500/10" },
        SHORTLISTED: { color: "text-yellow-400", border: "border-yellow-500/30", label: "SHORTLISTED", bg: "bg-yellow-500/10" },
        INTERVIEW: { color: "text-orange-400", border: "border-orange-500/30", label: "ONGOING", bg: "bg-orange-500/10" },
        PLACED: { color: "text-green-400", border: "border-green-500/30", label: "PLACED", bg: "bg-green-500/10" },
    };

    return (
        <div className="rounded-2xl border border-gray-800 bg-[#111] p-6">
            <h3 className="mb-4 text-base font-bold text-white">Active Tracking</h3>
            <div className="space-y-4">
                {activeApps.slice(0, 3).map((app) => {
                    const config = statusConfig[app.status] || statusConfig.APPLIED;
                    const progress = (app.stageNumber / app.totalStages) * 100;

                    return (
                        <div
                            key={app.id}
                            className={`rounded-xl border ${config.border} bg-[#0e0e0e] p-4`}
                        >
                            {/* Status + Stage */}
                            <div className="mb-3 flex items-center justify-between">
                                <span
                                    className={`rounded-full border ${config.border} ${config.bg} px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${config.color}`}
                                >
                                    {config.label}
                                </span>
                                <span className="text-xs text-gray-500 uppercase tracking-wider">
                                    Stage {app.stageNumber}/{app.totalStages}
                                </span>
                            </div>

                            {/* Company */}
                            <h4 className="text-sm font-bold text-white">{app.drive.company}</h4>
                            <p className="mb-3 text-xs text-gray-400">{app.drive.role}</p>

                            {/* Progress Bar */}
                            <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        app.status === "PLACED"
                                            ? "bg-green-500"
                                            : "bg-teal-500"
                                    }`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            {/* Stage Info */}
                            {app.stage && (
                                <div className="flex items-center gap-1.5 text-xs text-teal-400">
                                    <Circle className="h-2.5 w-2.5 fill-teal-400" />
                                    {app.stage}
                                </div>
                            )}
                        </div>
                    );
                })}

                {activeApps.length > 3 && (
                    <p className="text-center text-xs text-gray-500">
                        +{activeApps.length - 3} more active applications
                    </p>
                )}
            </div>
        </div>
    );
}
