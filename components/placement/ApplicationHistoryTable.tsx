import React from "react";
import { Eye, FileText } from "lucide-react";

interface Application {
    id: string;
    status: string;
    appliedAt: string;
    drive: {
        company: string;
        role: string;
    };
}

interface ApplicationHistoryTableProps {
    applications: Application[];
}

const statusStyles: Record<string, string> = {
    APPLIED: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    SHORTLISTED: "border-green-500/30 bg-green-500/10 text-green-400",
    INTERVIEW: "border-orange-500/30 bg-orange-500/10 text-orange-400",
    PLACED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    REJECTED: "border-red-500/30 bg-red-500/10 text-red-400",
    WITHDRAWN: "border-gray-500/30 bg-gray-500/10 text-gray-400",
};

const actionLabels: Record<string, string> = {
    SHORTLISTED: "View Details",
    REJECTED: "View Feedback",
    PLACED: "View Details",
    WITHDRAWN: "Details",
    APPLIED: "View Status",
    INTERVIEW: "View Details",
};

export default function ApplicationHistoryTable({
    applications,
}: ApplicationHistoryTableProps) {
    if (applications.length === 0) {
        return (
            <div className="rounded-2xl border border-gray-800 bg-[#111] p-6">
                <h3 className="mb-4 text-base font-bold text-white">Application History</h3>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText className="mb-3 h-8 w-8 text-gray-600" />
                    <p className="text-sm text-gray-500">No applications yet.</p>
                    <p className="mt-1 text-xs text-gray-600">
                        Register for recruitment drives to see your history here.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-gray-800 bg-[#111] p-6">
            <h3 className="mb-4 text-base font-bold text-white">Application History</h3>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-800">
                            <th className="pb-3 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                Company & Role
                            </th>
                            <th className="pb-3 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                Applied Date
                            </th>
                            <th className="pb-3 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                Status
                            </th>
                            <th className="pb-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                        {applications.map((app) => (
                            <tr key={app.id} className="group">
                                <td className="py-3.5 pr-4">
                                    <p className="text-sm font-medium text-white">
                                        {app.drive.company}
                                    </p>
                                    <p className="text-xs text-gray-500">{app.drive.role}</p>
                                </td>
                                <td className="py-3.5 pr-4">
                                    <p className="text-sm text-gray-400">
                                        {new Date(app.appliedAt).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "2-digit",
                                            year: "numeric",
                                        })}
                                    </p>
                                </td>
                                <td className="py-3.5 pr-4">
                                    <span
                                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                            statusStyles[app.status] || statusStyles.APPLIED
                                        }`}
                                    >
                                        {app.status}
                                    </span>
                                </td>
                                <td className="py-3.5">
                                    <button className="text-sm text-teal-400 hover:text-teal-300 transition-colors">
                                        {actionLabels[app.status] || "View"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
