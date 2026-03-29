"use client";

import React, { useState, useEffect } from "react";
import { Search, Users, Settings, MoreVertical, Plus, Smile, Send, Pin, Clock } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function GroupsPage() {
    const { data: session } = useSession();
    const [groups, setGroups] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [searchGroups, setSearchGroups] = useState("");
    const [messageInput, setMessageInput] = useState("");

    useEffect(() => {
        fetch("/api/coordinator/groups")
            .then(res => res.json())
            .then(data => {
                if (data.groups && data.groups.length > 0) {
                    setGroups(data.groups);
                    setSelectedGroup(data.groups[0].id);
                }
            });
    }, []);

    useEffect(() => {
        if (!selectedGroup) return;
        fetch(`/api/coordinator/groups/${selectedGroup}/messages`)
            .then(res => res.json())
            .then(data => {
                if (data.messages) setMessages(data.messages);
            });
    }, [selectedGroup]);

    const activeGroup = groups.find((g) => g.id === selectedGroup);

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedGroup) return;
        
        const tempMsg = {
            id: Date.now().toString(),
            content: messageInput,
            createdAt: new Date().toISOString(),
            user: { name: session?.user?.name || "Coordinator", role: "COORDINATOR" },
            userId: session?.user?.id,
        };
        setMessages(prev => [...prev, tempMsg]);
        const input = messageInput;
        setMessageInput("");

        const res = await fetch(`/api/coordinator/groups/${selectedGroup}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: input })
        });
        
        if (res.ok) {
            const data = await res.json();
            setMessages(prev => prev.map(m => m.id === tempMsg.id ? data.message : m));
        }
    };

    const roleStyles: Record<string, string> = {
        STUDENT: "bg-blue-50 text-blue-600",
        ADMIN: "bg-red-50 text-red-600",
        TEACHER: "bg-purple-50 text-purple-600",
        COORDINATOR: "bg-blue-600 text-white",
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

                <div className="flex-1 overflow-y-auto">
                    {groups.filter(g => g.name.toLowerCase().includes(searchGroups.toLowerCase())).map((group) => {
                        const lastMessage = group.messages?.[0];
                        return (
                            <button
                                key={group.id}
                                onClick={() => setSelectedGroup(group.id)}
                                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                                    selectedGroup === group.id ? "bg-blue-50" : "hover:bg-gray-50"
                                }`}
                            >
                                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-${group.color || "blue"}-500 text-sm text-white font-semibold`}>
                                    {group.icon || group.name.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="truncate text-sm font-semibold text-gray-900">{group.name}</p>
                                        <span className="text-[10px] text-gray-400 ml-2 flex-shrink-0">
                                            {lastMessage ? new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 truncate text-xs text-gray-500">
                                        {lastMessage ? `${lastMessage.user?.name}: ${lastMessage.content}` : "No messages yet"}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                    {groups.length === 0 && (
                        <div className="text-center p-4 text-sm text-gray-500">No active coordination groups</div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex flex-1 flex-col pt-14 bg-gray-50 overflow-hidden">
                {activeGroup ? (
                    <>
                        {/* Chat Header */}
                        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
                            <div className="flex items-center gap-3">
                                <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-${activeGroup.color || "blue"}-500 text-sm text-white font-semibold`}>
                                    {activeGroup.icon || activeGroup.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{activeGroup.name}</p>
                                    <p className="text-xs text-green-600">● {activeGroup._count?.members || 0} members</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                                    <Users className="h-3.5 w-3.5" />
                                    Members
                                </button>
                                <button className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50">
                                    <Settings className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                            {messages.map((msg) => {
                                const isCurrentUser = msg.userId === session?.user?.id || msg.user?.role === "COORDINATOR"; 
                                return (
                                    <div key={msg.id} className={`flex gap-3 ${isCurrentUser ? "justify-end" : ""}`}>
                                        {!isCurrentUser && (
                                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
                                                {msg.user?.name ? msg.user.name.charAt(0) : "U"}
                                            </div>
                                        )}
                                        <div className={`max-w-lg ${isCurrentUser ? "order-first" : ""}`}>
                                            {!isCurrentUser && (
                                                <div className="mb-1 flex items-center gap-2">
                                                    <span className="text-xs font-semibold text-gray-900">{msg.user?.name || "Unknown"}</span>
                                                    <span className="text-[10px] text-gray-400">
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase ${roleStyles[msg.user?.role] || roleStyles.STUDENT}`}>
                                                        {msg.user?.role || "STUDENT"}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            {msg.fileUrl ? (
                                                <div className="rounded-xl border border-gray-200 bg-white p-3 flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                                                        <span className="text-xs font-bold text-red-600">FILE</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">{msg.fileName || "Attachment"}</p>
                                                        <p className="text-xs text-gray-400">{msg.fileSize || "Unknown size"}</p>
                                                    </div>
                                                    <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-50">
                                                        <a href={msg.fileUrl} download>Download</a>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                                    msg.user?.role === "ADMIN"
                                                        ? "bg-gray-800 text-white"
                                                        : isCurrentUser
                                                        ? "bg-blue-600 text-white"
                                                        : "bg-white text-gray-700 border border-gray-200"
                                                }`}>
                                                    {msg.content?.split("\n").map((line: string, i: number) => (
                                                        <p key={i} className={i > 0 ? "mt-2" : ""}>{line}</p>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {isCurrentUser && (
                                                <div className="mt-1 flex items-center justify-end gap-2">
                                                    <span className="text-[10px] text-gray-400">
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <span className="text-[10px] font-semibold text-gray-500">You</span>
                                                </div>
                                            )}
                                        </div>
                                        {isCurrentUser && (
                                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                                                {session?.user?.name ? session.user.name.charAt(0) : "Y"}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Message Input */}
                        <div className="border-t border-gray-200 bg-white px-6 py-4">
                            <div className="flex items-center gap-3">
                                <button className="rounded-full p-2 text-gray-400 hover:bg-gray-100">
                                    <Plus className="h-5 w-5" />
                                </button>
                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type a message to the group..."
                                    className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                                />
                                <button 
                                    onClick={handleSendMessage}
                                    disabled={!messageInput.trim()}
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
                        {groups.length > 0 ? "Select a group to start chatting" : "No groups available"}
                    </div>
                )}
            </div>
        </div>
    );
}
