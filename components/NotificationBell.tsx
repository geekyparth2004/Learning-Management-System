
"use client";

import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import FormattedDate from "@/components/FormattedDate";
import { useRouter } from "next/navigation";

interface NotificationItem {
    id: string;
    title: string;
    category: "CONTEST" | "HACKATHON";
    createdAt: string;
    startTime: string;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const router = useRouter();

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await fetch("/api/notifications/contests");
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data);

                    // Simple logic: If created within last 24h, count as unread? 
                    // Or just count all since we don't have "seen" logic yet.
                    // Let's assume all fetched are "recent" enough to be notifications.
                    // Better: Store "lastCheck" in localStorage.

                    const lastCheck = localStorage.getItem("lastNotificationCheck");
                    let count = 0;
                    if (lastCheck) {
                        const lastDate = new Date(lastCheck);
                        count = data.filter((n: NotificationItem) => new Date(n.createdAt) > lastDate).length;
                    } else {
                        count = data.length;
                    }
                    setUnreadCount(count);
                }
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            }
        };

        fetchNotifications();
    }, []);

    const handleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            // Mark all as read when opening
            setUnreadCount(0);
            localStorage.setItem("lastNotificationCheck", new Date().toISOString());
        }
    };

    const handleItemClick = (n: NotificationItem) => {
        setIsOpen(false);
        if (n.category === "HACKATHON") {
            router.push("/hackathon");
        } else {
            router.push(`/contest/${n.id}`); // Or just /contest if id link is tricky
        }
    };

    return (
        <div className="relative">
            <button
                onClick={handleOpen}
                className="relative rounded-full bg-[#1e1e1e] p-2 text-gray-400 hover:bg-[#2a2a2a] hover:text-white transition-colors"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-gray-800 bg-[#161616] shadow-xl z-50">
                    <div className="border-b border-gray-800 px-4 py-3">
                        <h3 className="text-sm font-bold text-white">Notifications</h3>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-xs text-gray-500">
                                No new notifications
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => handleItemClick(n)}
                                    className="cursor-pointer border-b border-gray-800 px-4 py-3 hover:bg-[#1e1e1e] last:border-0"
                                >
                                    <div className="mb-1 flex items-center justify-between">
                                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${n.category === "HACKATHON" ? "bg-purple-900/30 text-purple-400" : "bg-blue-900/30 text-blue-400"
                                            }`}>
                                            {n.category}
                                        </span>
                                        <span className="text-[10px] text-gray-500">
                                            <FormattedDate date={n.createdAt} showTime={false} />
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-200 line-clamp-2">
                                        {n.title}
                                    </p>
                                    <div className="mt-1 text-[10px] text-gray-500">
                                        Starts: <FormattedDate date={n.startTime} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Backdrop to close */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
