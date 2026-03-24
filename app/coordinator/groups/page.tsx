"use client";

import React, { useState } from "react";
import { Search, Users, Settings, MoreVertical, Plus, Smile, Send, Pin, Clock } from "lucide-react";
import Link from "next/link";

// Sample group data structure (will be replaced by API data)
interface GroupMessage {
    id: string;
    sender: string;
    role: "STUDENT" | "ADMIN" | "TEACHER";
    message: string;
    time: string;
    isFile?: boolean;
    fileName?: string;
    fileSize?: string;
}

interface GroupItem {
    id: string;
    name: string;
    lastMessage: string;
    time: string;
    unread?: number;
    color: string;
    icon: string;
}

export default function GroupsPage() {
    const [selectedGroup, setSelectedGroup] = useState<string | null>("1");
    const [searchGroups, setSearchGroups] = useState("");
    const [messageInput, setMessageInput] = useState("");

    // Sample data to showcase the UI
    const groups: GroupItem[] = [
        { id: "1", name: "Google - SDE Intern", lastMessage: "Dr. Sharma: Please review th...", time: "10:45 AM", unread: 2, color: "bg-blue-600", icon: "🏢" },
        { id: "2", name: "Amazon - Data Analyst", lastMessage: "System: Interview schedule uploaded.", time: "Yesterday", color: "bg-orange-500", icon: "📊" },
        { id: "3", name: "Meta - Frontend Dev", lastMessage: "Student A: Shared my resume f...", time: "Tue", unread: 1, color: "bg-blue-500", icon: "<>" },
        { id: "4", name: "General Coordination", lastMessage: "Admin: Registration deadline extended.", time: "Mon", color: "bg-gray-500", icon: "📋" },
    ];

    const messages: GroupMessage[] = [
        { id: "1", sender: "Aryan Mehta", role: "STUDENT", message: "Hello everyone, has the interview link for the second round been shared yet? I haven't received any email.", time: "09:15 AM" },
        { id: "2", sender: "System Admin", role: "ADMIN", message: "Automated Notification:\n\nThe interview links are being generated. All shortlisted candidates will see a 'Join Meeting' button on their dashboard 15 minutes before their slot.", time: "09:20 AM" },
        { id: "3", sender: "You", role: "TEACHER", message: "Please review the final shortlist. I've pinned the PDF to the group for easy access. Aryan, your slot is at 2:30 PM today.", time: "10:45 AM" },
    ];

    const activeGroup = groups.find((g) => g.id === selectedGroup);

    const roleStyles: Record<string, string> = {
        STUDENT: "bg-blue-50 text-blue-600",
        ADMIN: "bg-red-50 text-red-600",
        TEACHER: "bg-blue-600 text-white",
    };

    return (
        <div className="flex h-screen">
            {/* Top Nav */}
            <div className="absolute top-0 left-56 right-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
                <div className="flex items-center gap-6">
                    <Link href="/coordinator" className="text-sm text-gray-500 hover:text-gray-700">Dashboard</Link>
                    <Link href="/coordinator/opportunities" className="text-sm text-gray-500 hover:text-gray-700">Opportunities</Link>
                    <span className="text-sm font-semibold text-blue-600 border-b-2 border-blue-600 pb-0.5">Coordination</span>
                    <Link href="/coordinator/students" className="text-sm text-gray-500 hover:text-gray-700">Students</Link>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search resources..."
                            className="w-48 rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Groups List */}
            <div className="w-80 flex-shrink-0 border-r border-gray-200 bg-white pt-14 flex flex-col">
                {/* Search */}
                <div className="px-4 pb-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchGroups}
                            onChange={(e) => setSearchGroups(e.target.value)}
                            placeholder="Search groups..."
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                        />
                    </div>
                </div>

                {/* Group Items */}
                <div className="flex-1 overflow-y-auto">
                    {groups.map((group) => (
                        <button
                            key={group.id}
                            onClick={() => setSelectedGroup(group.id)}
                            className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                                selectedGroup === group.id ? "bg-blue-50" : "hover:bg-gray-50"
                            }`}
                        >
                            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${group.color} text-sm text-white font-semibold`}>
                                {group.icon === "<>" ? "{ }" : group.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                    <p className="truncate text-sm font-semibold text-gray-900">{group.name}</p>
                                    <span className="text-[10px] text-gray-400 ml-2 flex-shrink-0">{group.time}</span>
                                </div>
                                <p className="mt-0.5 truncate text-xs text-gray-500">{group.lastMessage}</p>
                            </div>
                            {group.unread && (
                                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                                    {group.unread}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex flex-1 flex-col pt-14 bg-gray-50">
                {activeGroup ? (
                    <>
                        {/* Chat Header */}
                        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
                            <div className="flex items-center gap-3">
                                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${activeGroup.color} text-sm text-white font-semibold`}>
                                    {activeGroup.icon === "<>" ? "{ }" : activeGroup.icon}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{activeGroup.name}</p>
                                    <p className="text-xs text-green-600">● 14 members online</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                                    <Users className="h-3.5 w-3.5" />
                                    View Members
                                </button>
                                <button className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50">
                                    <Settings className="h-4 w-4" />
                                </button>
                                <button className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50">
                                    <MoreVertical className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                            {/* Day divider */}
                            <div className="text-center">
                                <span className="rounded-full bg-gray-200 px-3 py-1 text-[10px] font-medium text-gray-500 uppercase">Today</span>
                            </div>

                            {messages.map((msg) => {
                                const isTeacher = msg.role === "TEACHER";
                                return (
                                    <div key={msg.id} className={`flex gap-3 ${isTeacher ? "justify-end" : ""}`}>
                                        {!isTeacher && (
                                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
                                                {msg.sender.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                            </div>
                                        )}
                                        <div className={`max-w-lg ${isTeacher ? "order-first" : ""}`}>
                                            {!isTeacher && (
                                                <div className="mb-1 flex items-center gap-2">
                                                    <span className="text-xs font-semibold text-gray-900">{msg.sender}</span>
                                                    <span className="text-[10px] text-gray-400">{msg.time}</span>
                                                    <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase ${roleStyles[msg.role]}`}>
                                                        {msg.role}
                                                    </span>
                                                </div>
                                            )}
                                            <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                                msg.role === "ADMIN"
                                                    ? "bg-gray-800 text-white"
                                                    : isTeacher
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-white text-gray-700 border border-gray-200"
                                            }`}>
                                                {msg.message.split("\n").map((line, i) => (
                                                    <p key={i} className={i > 0 ? "mt-2" : ""}>{line}</p>
                                                ))}
                                            </div>
                                            {isTeacher && (
                                                <div className="mt-1 flex items-center justify-end gap-2">
                                                    <span className="text-[10px] text-gray-400">{msg.time}</span>
                                                    <span className="text-[10px] font-semibold text-gray-500">You</span>
                                                    <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase ${roleStyles[msg.role]}`}>
                                                        {msg.role}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {isTeacher && (
                                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                                                Y
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* File attachment */}
                            <div className="flex justify-end gap-3">
                                <div className="max-w-sm">
                                    <div className="rounded-xl border border-gray-200 bg-white p-3 flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                                            <span className="text-xs font-bold text-red-600">PDF</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">Final_Shortlist_Google_SDE.pdf</p>
                                            <p className="text-xs text-gray-400">1.2 MB • PDF DOCUMENT</p>
                                        </div>
                                        <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-50">
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                                    Y
                                </div>
                            </div>
                        </div>

                        {/* Message Input */}
                        <div className="border-t border-gray-200 bg-white px-6 py-4">
                            <div className="flex items-center gap-3">
                                <button className="rounded-full p-2 text-gray-400 hover:bg-gray-100">
                                    <Plus className="h-5 w-5" />
                                </button>
                                <button className="rounded-full p-2 text-gray-400 hover:bg-gray-100">
                                    <Smile className="h-5 w-5" />
                                </button>
                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder="Type a message or share an update..."
                                    className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                                />
                                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="mt-2 flex items-center gap-4 px-2">
                                <button className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700">
                                    <Pin className="h-3 w-3" />
                                    PIN MESSAGE
                                </button>
                                <button className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700">
                                    <Clock className="h-3 w-3" />
                                    SCHEDULE
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
                        Select a group to start chatting
                    </div>
                )}
            </div>
        </div>
    );
}
