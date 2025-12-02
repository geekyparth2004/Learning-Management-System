"use client";

import React, { useState } from "react";
import { Check, X, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

interface Review {
    id: string;
    studentName: string;
    studentEmail: string;
    courseName: string;
    itemName: string;
    topic: string;
    difficulty: string;
    submission: any;
}

export default function ReviewList({ initialReviews }: { initialReviews: Review[] }) {
    const [reviews, setReviews] = useState(initialReviews);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleAction = async (id: string, action: "APPROVED" | "REJECTED") => {
        setProcessingId(id);
        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, action }),
            });

            if (res.ok) {
                setReviews(reviews.filter(r => r.id !== id));
            }
        } catch (error) {
            console.error("Failed to update review", error);
        } finally {
            setProcessingId(null);
        }
    };

    if (reviews.length === 0) {
        return (
            <div className="rounded-xl border border-gray-800 bg-[#161616] p-12 text-center text-gray-400">
                <p>No pending reviews found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {reviews.map((review) => (
                <div key={review.id} className="rounded-xl border border-gray-800 bg-[#161616] overflow-hidden">
                    <div
                        className="flex items-center justify-between p-6 cursor-pointer hover:bg-[#1e1e1e] transition-colors"
                        onClick={() => setExpandedId(expandedId === review.id ? null : review.id)}
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 font-bold">
                                {review.studentName[0]}
                            </div>
                            <div>
                                <h3 className="font-bold">{review.studentName}</h3>
                                <p className="text-sm text-gray-400">{review.courseName} • {review.itemName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="text-sm font-medium text-indigo-400">{review.topic}</div>
                                <div className={`text-xs font-bold ${review.difficulty === "Hard" ? "text-red-400" :
                                        review.difficulty === "Medium" ? "text-yellow-400" :
                                            "text-green-400"
                                    }`}>{review.difficulty}</div>
                            </div>
                            {expandedId === review.id ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                        </div>
                    </div>

                    {expandedId === review.id && (
                        <div className="border-t border-gray-800 p-6 bg-[#0e0e0e]">
                            <h4 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Interview Transcript</h4>
                            <div className="space-y-4 mb-8 max-h-96 overflow-y-auto pr-2">
                                {Array.isArray(review.submission) && review.submission.map((msg: any, idx: number) => (
                                    <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[80%] rounded-lg p-3 ${msg.role === "user"
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-800 text-gray-300"
                                            }`}>
                                            <p className="text-sm">{msg.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end gap-3 border-t border-gray-800 pt-6">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleAction(review.id, "REJECTED"); }}
                                    disabled={processingId === review.id}
                                    className="flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-900/20 px-4 py-2 text-red-400 hover:bg-red-900/40 disabled:opacity-50"
                                >
                                    <X size={16} /> Reject
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleAction(review.id, "APPROVED"); }}
                                    disabled={processingId === review.id}
                                    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                >
                                    <Check size={16} /> Approve
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
