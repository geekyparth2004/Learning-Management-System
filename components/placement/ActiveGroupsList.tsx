import React from "react";
import { Users, MessageSquare } from "lucide-react";

interface Group {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    memberCount: number;
    isMember: boolean;
}

interface ActiveGroupsListProps {
    groups: Group[];
}

const colorMap: Record<string, string> = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
    teal: "from-teal-500 to-teal-600",
    red: "from-red-500 to-red-600",
};

export default function ActiveGroupsList({ groups }: ActiveGroupsListProps) {
    return (
        <div className="rounded-2xl border border-gray-800 bg-[#111] p-5">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Active Groups</h3>
                {groups.length > 0 && (
                    <button className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
                        View All
                    </button>
                )}
            </div>

            {groups.length > 0 ? (
                <div className="space-y-3">
                    {groups.slice(0, 4).map((group, index) => {
                        const gradient = colorMap[group.color || "blue"] || colorMap.blue;
                        return (
                            <div
                                key={group.id}
                                className="group flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-gray-800/30 cursor-pointer"
                            >
                                <div
                                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} text-sm`}
                                >
                                    {group.icon || <MessageSquare className="h-4 w-4 text-white" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-white">
                                        {group.name}
                                    </p>
                                    <p className="truncate text-xs text-gray-500">
                                        {group.description || `${group.memberCount} members`}
                                    </p>
                                </div>
                                {index === 0 && (
                                    <div className="h-2 w-2 rounded-full bg-teal-400 flex-shrink-0" />
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Users className="mb-2 h-6 w-6 text-gray-600" />
                    <p className="text-xs text-gray-500">No groups yet.</p>
                </div>
            )}
        </div>
    );
}
