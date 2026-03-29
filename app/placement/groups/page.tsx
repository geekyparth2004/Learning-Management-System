"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Users, X, Plus, Send, ArrowLeft, Paperclip, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function GroupsPage() {
    const { data: session } = useSession();
    const [groups, setGroups] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [searchGroups, setSearchGroups] = useState("");
    const [messageInput, setMessageInput] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch("/api/placement/groups")
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
        fetch(`/api/placement/groups/${selectedGroup}/messages`)
            .then(res => res.json())
            .then(data => {
                if (data.messages) setMessages(data.messages);
            });
    }, [selectedGroup]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const activeGroup = groups.find((g) => g.id === selectedGroup);

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedGroup) return;
        
        const tempMsg = {
            id: Date.now().toString(),
            content: messageInput,
            createdAt: new Date().toISOString(),
            user: { name: session?.user?.name || "Student", role: "STUDENT" },
            userId: session?.user?.id,
        };
        setMessages(prev => [...prev, tempMsg]);
        const input = messageInput;
        setMessageInput("");

        const res = await fetch(`/api/placement/groups/${selectedGroup}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: input })
        });
        
        if (res.ok) {
            const data = await res.json();
            setMessages(prev => prev.map(m => m.id === tempMsg.id ? data.message : m));
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedGroup) return;

        setIsUploading(true);
        try {
            const res = await fetch("/api/placement/groups/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename: file.name, contentType: file.type }),
            });
            const { uploadUrl, publicUrl } = await res.json();
            if (!uploadUrl) throw new Error("Failed to get upload URL");

            await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });

            const sizeStr = file.size < 1024 * 1024 
                ? `${Math.round(file.size / 1024)} KB` 
                : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

            const resMsg = await fetch(`/api/placement/groups/${selectedGroup}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: `📎 ${file.name}`,
                    fileUrl: publicUrl,
                    fileName: file.name,
                    fileSize: sizeStr
                })
            });

            if (resMsg.ok) {
                const data = await resMsg.json();
                setMessages(prev => [...prev, data.message]);
            }
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload file. Please try again.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const roleStyles: Record<string, string> = {
        STUDENT: "bg-teal-500/20 text-teal-400",
        COORDINATOR: "bg-blue-500/20 text-blue-400",
        TEACHER: "bg-purple-500/20 text-purple-400",
    };

    return (
        <div className="flex h-screen bg-[#0e0e0e] text-white overflow-hidden">
            {/* Groups List */}
            <div className="w-80 flex-shrink-0 border-r border-gray-800 bg-[#111] flex flex-col pt-4">
                <div className="px-6 mb-6 flex items-center gap-3">
                    <Link href="/placement" className="rounded-lg hover:bg-gray-800 p-2 transition-colors">
                        <ArrowLeft className="h-5 w-5 text-gray-400" />
                    </Link>
                    <h1 className="text-xl font-bold">Groups</h1>
                </div>

                <div className="px-4 pb-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            value={searchGroups}
                            onChange={(e) => setSearchGroups(e.target.value)}
                            placeholder="Search groups..."
                            className="w-full rounded-xl border border-gray-800 bg-[#1a1a1a] py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 space-y-2">
                    {groups.filter(g => g.name.toLowerCase().includes(searchGroups.toLowerCase())).map((group) => {
                        return (
                            <button
                                key={group.id}
                                onClick={() => setSelectedGroup(group.id)}
                                className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                                    selectedGroup === group.id ? "bg-gray-800" : "hover:bg-gray-800/50"
                                }`}
                            >
                                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-${group.color || "teal"}-500 to-${group.color || "teal"}-700 text-sm font-bold shadow-lg`}>
                                    {group.icon || group.name.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold">{group.name}</p>
                                    <p className="truncate text-xs text-gray-400">{group.isMember ? "Joined" : "View Group"}</p>
                                </div>
                            </button>
                        );
                    })}
                    {groups.length === 0 && (
                        <div className="text-center p-4 text-sm text-gray-500">No active groups</div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex flex-1 flex-col bg-[#0e0e0e] relative">
                {activeGroup ? (
                    <div className="flex flex-1 flex-col overflow-hidden">
                        {/* Chat Header */}
                        <div className="flex items-center justify-between border-b border-gray-800 bg-[#111] px-6 py-4 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-${activeGroup.color || "teal"}-500 to-${activeGroup.color || "teal"}-700 text-sm font-bold shadow`}>
                                    {activeGroup.icon || activeGroup.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-base font-bold">{activeGroup.name}</h2>
                                    <p className="text-xs text-teal-400 font-medium">● {activeGroup.memberCount || 0} members</p>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                            {messages.map((msg) => {
                                const isCurrentUser = msg.userId === session?.user?.id;
                                return (
                                    <div key={msg.id} className={`flex gap-3 ${isCurrentUser ? "justify-end" : ""}`}>
                                        {!isCurrentUser && (
                                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-800 text-xs font-semibold">
                                                {msg.user?.name ? msg.user.name.charAt(0).toUpperCase() : "U"}
                                            </div>
                                        )}
                                        <div className={`max-w-lg ${isCurrentUser ? "order-first" : ""}`}>
                                            <div className={`mb-1.5 flex items-center gap-2 ${isCurrentUser ? "justify-end" : ""}`}>
                                                <span className="text-xs font-semibold text-gray-300">
                                                    {isCurrentUser ? "You" : (msg.user?.name || "Unknown")}
                                                </span>
                                                <span className="text-[10px] text-gray-500">
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${roleStyles[msg.user?.role] || roleStyles.STUDENT}`}>
                                                    {msg.user?.role || "STUDENT"}
                                                </span>
                                            </div>

                                            {msg.fileUrl ? (
                                                <div className="rounded-xl border border-gray-800 bg-[#1a1a1a] p-3 flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10">
                                                        <span className="text-xs font-bold text-teal-400">FILE</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-white truncate">{msg.fileName || "Attachment"}</p>
                                                        <p className="text-xs text-gray-500">{msg.fileSize || "Unknown size"}</p>
                                                    </div>
                                                    <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
                                                        <a href={msg.fileUrl} download>Download</a>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className={`rounded-2xl px-5 py-3 text-sm leading-relaxed ${
                                                    isCurrentUser
                                                        ? "bg-teal-600 text-white"
                                                        : "bg-[#1a1a1a] text-gray-200 border border-gray-800"
                                                }`}>
                                                    {msg.content?.split("\n").map((line: string, i: number) => (
                                                        <p key={i} className={i > 0 ? "mt-2" : ""}>{line}</p>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        {activeGroup.isMember ? (
                            <div className="border-t border-gray-800 bg-[#111] px-6 py-4 flex-shrink-0">
                                <div className="flex items-center gap-3 max-w-4xl mx-auto">
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                                    />
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="rounded-full p-2.5 text-gray-400 hover:bg-gray-800 hover:text-white disabled:opacity-50 transition-colors"
                                        title="Attach File"
                                    >
                                        {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
                                    </button>
                                    <input
                                        type="text"
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Message group..."
                                        className="flex-1 rounded-full border border-gray-800 bg-[#1a1a1a] px-5 py-3 text-sm text-white placeholder-gray-500 focus:border-teal-500/50 focus:outline-none transition-colors"
                                    />
                                    <button 
                                        onClick={handleSendMessage}
                                        disabled={!messageInput.trim()}
                                        className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-500 text-black hover:bg-teal-400 disabled:opacity-50 transition-colors shadow-lg"
                                    >
                                        <Send className="h-4 w-4 ml-1 pl-0.5" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="border-t border-gray-800 bg-[#111] px-6 py-4 text-center text-sm text-gray-500">
                                You are not a member of this group.
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-1 items-center justify-center text-sm text-gray-600">
                        {groups.length > 0 ? "Select a group to start chatting" : "No active groups yet"}
                    </div>
                )}
            </div>
        </div>
    );
}
