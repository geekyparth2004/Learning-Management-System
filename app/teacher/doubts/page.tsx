"use client";

import React, { useState, useEffect } from "react";
import { MessageCircle, CheckCircle, Clock, BookOpen, User, Reply } from "lucide-react";

interface Doubt {
    id: string;
    content: string;
    status: "PENDING" | "ANSWERED";
    answer: string | null;
    createdAt: string;
    student: {
        name: string | null;
        image: string | null;
    };
    moduleItem: {
        title: string;
        module: {
            title: string;
            course: {
                title: string;
            };
        };
    };
}

export default function TeacherDoubtsPage() {
    const [doubts, setDoubts] = useState<Doubt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<"ALL" | "PENDING" | "ANSWERED">("PENDING");
    
    // For answering
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchDoubts = async () => {
        setIsLoading(true);
        try {
            const sessionRes = await fetch("/api/auth/session");
            const session = await sessionRes.json();
            
            if (!session?.user?.id) return;

            let url = `/api/doubts?teacherId=${session.user.id}`;
            if (filter !== "ALL") {
                url += `&status=${filter}`;
            }

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setDoubts(data);
            }
        } catch (error) {
            console.error("Failed to fetch doubts", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDoubts();
    }, [filter]);

    const handleAnswer = async (id: string) => {
        if (!replyText.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/doubts/${id}/answer`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answer: replyText.trim() }),
            });

            if (res.ok) {
                setReplyText("");
                setReplyingTo(null);
                await fetchDoubts(); // Refresh list
            } else {
                alert("Failed to post answer");
            }
        } catch (error) {
            console.error("Failed to answer doubt", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Student Doubts</h1>
                    <p className="mt-2 text-gray-400">Manage and answer questions from your students.</p>
                </div>
                
                <div className="flex rounded-lg bg-[#111111] p-1 border border-gray-800">
                    <button
                        onClick={() => setFilter("PENDING")}
                        className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                            filter === "PENDING" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                        }`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setFilter("ANSWERED")}
                        className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                            filter === "ANSWERED" ? "bg-green-600 text-white" : "text-gray-400 hover:text-white"
                        }`}
                    >
                        Answered
                    </button>
                    <button
                        onClick={() => setFilter("ALL")}
                        className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                            filter === "ALL" ? "bg-[#1e1e1e] text-white" : "text-gray-400 hover:text-white"
                        }`}
                    >
                        All
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-800 border-t-blue-500" />
                </div>
            ) : doubts.length === 0 ? (
                <div className="rounded-xl border border-gray-800 bg-[#111111] p-12 text-center text-gray-500 mt-4">
                    <MessageCircle className="mx-auto h-12 w-12 opacity-20 mb-4" />
                    <p className="text-lg">No doubts found.</p>
                    <p className="text-sm">You're all caught up!</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {doubts.map((doubt) => (
                        <div key={doubt.id} className="rounded-xl border border-gray-800 bg-[#111111] overflow-hidden transition-colors hover:border-gray-700">
                            {/* Header / Context */}
                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 bg-[#161616] px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-900/30 text-blue-400 font-bold">
                                        {doubt.student?.name?.[0] || <User size={16} />}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-200">{doubt.student?.name || "Anonymous Student"}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Clock size={12} />
                                            <span>{new Date(doubt.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1 text-xs">
                                    <div className="flex items-center gap-1.5 text-blue-400 bg-blue-900/10 px-2 py-1 rounded-md">
                                        <BookOpen size={12} />
                                        <span className="font-medium max-w-[200px] truncate">{doubt.moduleItem?.module?.course?.title}</span>
                                    </div>
                                    <span className="text-gray-500 max-w-[200px] truncate">
                                        {doubt.moduleItem?.module?.title} • {doubt.moduleItem.title}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Doubt Content */}
                            <div className="p-6">
                                <p className="text-gray-300 mb-6 text-sm leading-relaxed">{doubt.content}</p>

                                {/* Answer Section */}
                                {doubt.status === "ANSWERED" && doubt.answer ? (
                                    <div className="rounded-lg bg-[#161616] p-4 border-l-4 border-green-500">
                                        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-green-500">
                                            <CheckCircle size={16} />
                                            Your Answer
                                        </div>
                                        <p className="text-sm text-gray-300">{doubt.answer}</p>
                                    </div>
                                ) : (
                                    <div>
                                        {replyingTo === doubt.id ? (
                                            <div className="space-y-3">
                                                <textarea
                                                    autoFocus
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    placeholder="Type your answer here..."
                                                    className="w-full rounded-lg border border-gray-700 bg-[#1e1e1e] p-3 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[100px]"
                                                />
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={() => {
                                                            setReplyingTo(null);
                                                            setReplyText("");
                                                        }}
                                                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => handleAnswer(doubt.id)}
                                                        disabled={isSubmitting || !replyText.trim()}
                                                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                                                    >
                                                        {isSubmitting ? "Sending..." : "Send Answer"}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setReplyingTo(doubt.id);
                                                    setReplyText("");
                                                }}
                                                className="flex items-center gap-2 rounded-lg bg-blue-900/30 px-4 py-2 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-900/50 hover:text-blue-300"
                                            >
                                                <Reply size={16} />
                                                Answer Doubt
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
