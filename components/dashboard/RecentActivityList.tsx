import React from "react";
import { CheckCircle, Code, Trophy, Video, FileText } from "lucide-react";
import FormattedDate from "@/components/FormattedDate";

interface ActivityItem {
    id: string;
    type: "MODULE_ITEM" | "SUBMISSION" | "CONTEST";
    title: string;
    date: Date;
    description?: string;
}

export default function RecentActivityList({ activities }: { activities: ActivityItem[] }) {
    if (activities.length === 0) {
        return (
            <div className="mt-4 text-center text-sm text-gray-500">
                No recent activity.
            </div>
        );
    }

    return (
        <div className="mt-4 space-y-3">
            <h4 className="text-sm font-medium text-gray-400">Recent Activity</h4>
            <div className="space-y-3">
                {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 rounded-lg border border-gray-800 bg-[#1a1a1a] p-2 transition-colors hover:border-gray-700">
                        <div className="mt-0.5">
                            {activity.type === "MODULE_ITEM" && <CheckCircle className="h-4 w-4 text-green-400" />}
                            {activity.type === "SUBMISSION" && <Code className="h-4 w-4 text-blue-400" />}
                            {activity.type === "CONTEST" && <Trophy className="h-4 w-4 text-yellow-400" />}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="truncate text-sm font-medium text-gray-200">
                                {activity.title}
                            </p>
                            <p className="text-xs text-gray-500">
                                <FormattedDate date={activity.date.toISOString()} />
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
