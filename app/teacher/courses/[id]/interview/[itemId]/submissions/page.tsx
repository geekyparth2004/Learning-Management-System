"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, Clock, Volume2, Play, Pause, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface InterviewSubmission {
    id: string; // ModuleItemProgress ID
    userId: string;
    aiSubmission: string; // JSON string of messages
    reviewStatus: "PENDING" | "APPROVED" | "REJECTED";
    startedAt: string;
    completedAt?: string;
    user: {
        id: string;
        name: string;
        email: string;
        image?: string;
    };
}

interface Message {
    role: "assistant" | "user";
    content: string;
    audioUrl?: string; // Additional field for user audio
}

export default function InterviewSubmissionsPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.id as string;
    const itemId = params.itemId as string;

    const [submissions, setSubmissions] = useState<InterviewSubmission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState<InterviewSubmission | null>(null);

    // Filter Logic
    const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");

    const fetchSubmissions = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/modules/items/${itemId}/submissions`);
            if (res.ok) {
                const data = await res.json();
                setSubmissions(data);
                // Auto-select first PENDING submission
                const firstPending = data.find((s: InterviewSubmission) => s.reviewStatus === "PENDING");
                if (firstPending) setSelectedSubmission(firstPending);
                else if (data.length > 0) setSelectedSubmission(data[0]);
            }
        } catch (error) {
            console.error("Failed to fetch submissions", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, [itemId]);

    const handleEvaluate = async (status: "APPROVED" | "REJECTED") => {
        if (!selectedSubmission) return;

        // Optimistic UI update
        const updatedSub = { ...selectedSubmission, reviewStatus: status };
        setSubmissions(prev => prev.map(s => s.id === updatedSub.id ? updatedSub : s));
        setSelectedSubmission(updatedSub);

        try {
            const res = await fetch(`/api/modules/items/${itemId}/evaluate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: selectedSubmission.userId,
                    status: status,
                }),
            });
            if (!res.ok) throw new Error("Failed to evaluate");

            // Re-fetch to confirm? Or just rely on optimistic
        } catch (error) {
            console.error(error);
            alert("Failed to submit review");
            // Revert on error would be better
            fetchSubmissions();
        }
    };

    const [messagesState, setMessagesState] = useState<Message[]>([]);

    useEffect(() => {
        const loadMessages = async () => {
            if (!selectedSubmission?.aiSubmission) {
                setMessagesState([]);
                return;
            }

            try {
                let parsed: Message[] = JSON.parse(selectedSubmission.aiSubmission);

                // Sign URLs
                const signedMessages = await Promise.all(
                    parsed.map(async (msg) => {
                        if (msg.role === "user" && msg.audioUrl) {
                            try {
                                // Check if it needs signing (s3/r2)
                                if (msg.audioUrl.includes("r2.cloudflarestorage") ||
                                    msg.audioUrl.includes("backblazeb2") ||
                                    !msg.audioUrl.startsWith("http")) { // Assume key if not http? actually existing logic sends full public url usually, but let's be safe.

                                    const res = await fetch("/api/video/sign", {
                                        method: "POST",
                                        body: JSON.stringify({ url: msg.audioUrl })
                                    });
                                    const data = await res.json();
                                    if (data.signedUrl) {
                                        return { ...msg, audioUrl: data.signedUrl };
                                    }
                                }
                            } catch (e) {
                                console.error("Failed to sign audio", e);
                            }
                        }
                        return msg;
                    })
                );
                setMessagesState(signedMessages);
            } catch (e) {
                console.error("Failed to parse", e);
                setMessagesState([]);
            }
        };
        loadMessages();
    }, [selectedSubmission]);

    // parseMessages removed/unused now

    const filteredSubmissions = submissions.filter(s => filter === "ALL" || s.reviewStatus === filter);

    if (isLoading) return <div className="flex items-center justify-center min-h-screen bg-[#0e0e0e] text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-[#0e0e0e] text-white flex flex-col">
            <header className="border-b border-gray-800 bg-[#161616] px-6 py-4 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <Link href={`/teacher/courses/${courseId}/builder`} className="text-gray-400 hover:text-white">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">Interview Reviews</h1>
                        <p className="text-sm text-gray-400">Review student audio responses</p>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar List */}
                <div className="w-80 border-r border-gray-800 bg-[#111111] flex flex-col">
                    <div className="p-4 border-b border-gray-800">
                        <div className="flex gap-2 mb-4">
                            {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilter(status)}
                                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${filter === status
                                        ? "bg-blue-600 border-blue-600 text-white"
                                        : "border-gray-700 text-gray-400 hover:border-gray-500"
                                        }`}
                                >
                                    {status === "ALL" ? "All" : status[0] + status.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                        <h2 className="font-semibold text-gray-400">Students ({filteredSubmissions.length})</h2>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-1">
                        {filteredSubmissions.map((sub) => (
                            <button
                                key={sub.id}
                                onClick={() => setSelectedSubmission(sub)}
                                className={`w-full rounded p-3 text-left transition-colors ${selectedSubmission?.id === sub.id
                                    ? "bg-blue-900/30 border border-blue-900"
                                    : "bg-[#1e1e1e] border border-gray-800 hover:border-gray-600"
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-sm truncate">{sub.user.name || sub.user.email}</span>
                                    {sub.reviewStatus === "APPROVED" ? (
                                        <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                                    ) : sub.reviewStatus === "REJECTED" ? (
                                        <XCircle size={14} className="text-red-500 flex-shrink-0" />
                                    ) : (
                                        <Clock size={14} className="text-yellow-500 flex-shrink-0" />
                                    )}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {sub.startedAt ? new Date(sub.startedAt).toLocaleDateString() : "Unknown Date"}
                                </div>
                            </button>
                        ))}
                        {filteredSubmissions.length === 0 && (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                No {filter !== "ALL" ? filter.toLowerCase() : ""} submissions found.
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col bg-[#0e0e0e] overflow-hidden">
                    {selectedSubmission ? (
                        <>
                            {/* User Header */}
                            <div className="border-b border-gray-800 bg-[#161616] px-6 py-4 flex justify-between items-center flex-shrink-0">
                                <div>
                                    <h3 className="font-bold text-lg">{selectedSubmission.user.name}</h3>
                                    <p className="text-sm text-gray-400">{selectedSubmission.user.email}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {selectedSubmission.reviewStatus === "PENDING" && (
                                        <>
                                            <button
                                                onClick={() => handleEvaluate("REJECTED")}
                                                className="flex items-center gap-2 px-4 py-2 rounded bg-red-900/20 text-red-400 border border-red-900/50 hover:bg-red-900/40 transition-colors"
                                            >
                                                <XCircle size={16} /> Reject
                                            </button>
                                            <button
                                                onClick={() => handleEvaluate("APPROVED")}
                                                className="flex items-center gap-2 px-4 py-2 rounded bg-green-900/20 text-green-400 border border-green-900/50 hover:bg-green-900/40 transition-colors"
                                            >
                                                <CheckCircle size={16} /> Approve
                                            </button>
                                        </>
                                    )}
                                    {selectedSubmission.reviewStatus !== "PENDING" && (
                                        <div className={`flex items-center gap-2 px-4 py-2 rounded font-bold ${selectedSubmission.reviewStatus === "APPROVED"
                                            ? "bg-green-900/20 text-green-400 border border-green-900"
                                            : "bg-red-900/20 text-red-400 border border-red-900"
                                            }`}>
                                            {selectedSubmission.reviewStatus === "APPROVED" ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                            {selectedSubmission.reviewStatus}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Chat History / Audio */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {messagesState.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}>
                                        <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === "assistant"
                                            ? "bg-[#1e1e1e] border border-gray-800 rounded-tl-sm"
                                            : "bg-blue-900/20 border border-blue-900/50 rounded-tr-sm"
                                            }`}>
                                            <div className="mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                {msg.role === "assistant" ? "Interviewer" : "Student"}
                                            </div>
                                            <p className="text-gray-200 mb-3 whitespace-pre-wrap">{msg.content}</p>

                                            {msg.role === "user" && msg.audioUrl && (
                                                <div className="mt-2 pt-2 border-t border-gray-700/50">
                                                    <audio controls src={msg.audioUrl} className="w-full h-8" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {messagesState.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                        <AlertCircle size={48} className="mb-4 opacity-50" />
                                        <p>No recording data found.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex h-full items-center justify-center text-gray-500">
                            <div className="text-center">
                                <Volume2 size={48} className="mx-auto mb-4 opacity-50" />
                                <p>Select a student to review their interview</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
