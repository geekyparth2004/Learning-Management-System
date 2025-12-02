"use client";

import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: "VIDEO_COMPLETED" | "ASSIGNMENT_SUBMITTED";
    link?: string;
    isRead: boolean;
    createdAt: string;
}

export default function TeacherNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative rounded-full p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-lg border border-gray-800 bg-[#161616] shadow-xl z-50">
                    <div className="border-b border-gray-800 p-3">
                        <h3 className="font-semibold text-white">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">
                                No notifications
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`border-b border-gray-800 p-3 transition-colors hover:bg-[#1e1e1e] ${!notification.isRead ? "bg-blue-900/10" : ""
                                        }`}
                                >
                                    <div className="mb-1 flex items-start justify-between">
                                        <h4 className="text-sm font-medium text-white">
                                            {notification.title}
                                        </h4>
                                        <span className="text-xs text-gray-500">
                                            {new Date(notification.createdAt).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                    </div>
                                    <p className="mb-2 text-xs text-gray-400">
                                        {notification.message}
                                    </p>
                                    {notification.link && (
                                        <Link
                                            href={notification.link}
                                            className="text-xs text-blue-400 hover:underline"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            View Details
                                        </Link>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
