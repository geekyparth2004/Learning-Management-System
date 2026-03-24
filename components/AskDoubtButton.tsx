"use client";

import React, { useState, useEffect } from "react";
import { MessageCircle, Send, User, X } from "lucide-react";

interface Doubt {
    id: string;
    content: string;
    student: {
        name: string | null;
        image: string | null;
    };
    status: "PENDING" | "ANSWERED";
    answer: string | null;
    createdAt: string;
}

interface AskDoubtButtonProps {
    moduleItemId: string;
    courseId: string;
    itemTitle: string;
}

export default function AskDoubtButton({ moduleItemId, courseId, itemTitle }: AskDoubtButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [doubts, setDoubts] = useState<Doubt[]>([]);
    const [newDoubt, setNewDoubt] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const fetchDoubts = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/doubts?moduleItemId=${moduleItemId}`);
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
        if (isOpen) {
            fetchDoubts();
        }
    }, [isOpen, moduleItemId]);

    const handleSubmit = async () => {
        if (!newDoubt.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/doubts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: newDoubt.trim(),
                    moduleItemId,
                    courseId,
                }),
            });

            if (res.ok) {
                setNewDoubt("");
                await fetchDoubts(); // Refresh list
            } else {
                alert("Failed to post doubt. Please try again.");
            }
        } catch (error) {
            console.error("Failed to post doubt", error);
            alert("An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 rounded bg-[#2a2a2a] px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[#333] text-gray-200"
            >
                <MessageCircle size={16} className="text-blue-400" />
                Ask a Doubt
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
                    <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-gray-800 bg-[#111111] shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-800 bg-[#161616] p-4 text-left">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-900/30 text-blue-400">
                                    <MessageCircle size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-200">Ask a Doubt</h3>
                                    <p className="text-xs text-gray-500">Stuck on {itemTitle}? Ask a question!</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded-md p-2 text-gray-500 transition-colors hover:bg-[#222] hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-4 text-left">
                            {/* Ask Form */}
                            <div className="mb-6 flex gap-3">
                                <textarea
                                    value={newDoubt}
                                    onChange={(e) => setNewDoubt(e.target.value)}
                                    placeholder="Type your doubt here..."
                                    className="flex-1 min-h-[80px] rounded-lg border border-gray-700 bg-[#1e1e1e] p-3 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !newDoubt.trim()}
                                    className="flex h-[80px] w-[80px] flex-col items-center justify-center gap-1 xl:gap-2 rounded-lg bg-blue-600 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            <span className="text-xs">Send</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Doubts List */}
                            <h4 className="mb-3 text-sm font-semibold text-gray-400">Previous Doubts</h4>
                            {isLoading ? (
                                <div className="py-8 text-center text-sm text-gray-500">Loading doubts...</div>
                            ) : doubts.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-gray-800 p-8 text-center text-sm text-gray-500">
                                    No doubts asked yet for this item. Be the first!
                                </div>
                            ) : (
                                <div className="space-y-4 pr-1">
                                    {doubts.map((doubt) => (
                                        <div key={doubt.id} className="rounded-lg border border-gray-800 bg-[#161616] p-4">
                                            <div className="mb-3 flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-900/50 text-xs font-bold text-indigo-400">
                                                        {doubt.student?.name?.[0] || <User size={14} />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-medium text-gray-300">
                                                            {doubt.student?.name || "Anonymous Student"}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500">
                                                            {new Date(doubt.createdAt).toLocaleString([], {
                                                                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="mb-4 text-sm text-gray-200 whitespace-pre-wrap">{doubt.content}</p>

                                            {doubt.status === "ANSWERED" && doubt.answer ? (
                                                <div className="rounded-md border border-green-900/30 bg-[#1e1e1e] p-3">
                                                    <div className="mb-1.5 text-xs font-bold text-green-500">Teacher's Reply:</div>
                                                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{doubt.answer}</p>
                                                </div>
                                            ) : (
                                                <div className="inline-block rounded-full bg-yellow-900/20 px-2 py-0.5 text-[10px] font-medium text-yellow-500">
                                                    Pending Answer
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
