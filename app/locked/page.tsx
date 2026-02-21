"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Key, CreditCard, ArrowRight, CheckCircle } from "lucide-react";

export default function LockedPage() {
    const router = useRouter();
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleApplyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const res = await fetch("/api/student/apply-referral", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: code.trim() })
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data || "Invalid code or an error occurred.");
            } else {
                setSuccess("Code applied successfully! Redirecting...");
                setTimeout(() => {
                    // Force refresh to pull new subscription state via the guard
                    window.location.href = "/assignment";
                }, 1500);
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSimulatePayment = async () => {
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const res = await fetch("/api/student/pay", {
                method: "POST",
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data || "Payment failed.");
            } else {
                setSuccess("Payment successful! Account unlocked.");
                setTimeout(() => {
                    window.location.href = "/assignment";
                }, 1500);
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
            <div className="max-w-xl w-full flex flex-col items-center">
                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                    <Lock className="w-10 h-10 text-blue-500" />
                </div>

                <h1 className="text-3xl font-bold text-white mb-2 text-center">Platform Access Locked</h1>
                <p className="text-gray-400 text-center mb-10 max-w-md">
                    You need an active subscription or a valid teacher referral code to explore the premium courses, assignments, and coding features.
                </p>

                {error && (
                    <div className="w-full bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 text-sm">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="w-full bg-green-500/10 border border-green-500/20 text-green-500 p-4 flex items-center gap-3 rounded-xl mb-6 text-sm">
                        <CheckCircle className="w-5 h-5" />
                        {success}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    {/* Option 1: Referral Code */}
                    <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <Key className="w-5 h-5 text-purple-400" />
                            <h2 className="text-lg font-semibold text-white">4-Day Free Trial</h2>
                        </div>
                        <p className="text-sm text-gray-400 mb-6 flex-grow">
                            Received a referral code from your teacher? Enter it below to unlock a 4-day trial instantly.
                        </p>
                        <form onSubmit={handleApplyCode} className="space-y-4">
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="e.g. TCH-XYZ123"
                                className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500 uppercase"
                                disabled={loading || !!success}
                            />
                            <button
                                type="submit"
                                disabled={!code.trim() || loading || !!success}
                                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-3 font-medium transition-all flex items-center justify-center gap-2"
                            >
                                {loading && !success ? "Verifying..." : "Apply Code"} <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>
                    </div>

                    {/* Option 2: Payment */}
                    <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <CreditCard className="w-5 h-5 text-blue-400" />
                            <h2 className="text-lg font-semibold text-white">Lifetime Subscription</h2>
                        </div>
                        <p className="text-sm text-gray-400 mb-6 flex-grow">
                            Ready to dive in? Purchase a full one-time subscription for unlimited lifetime access to all coding challenges and video lessons.
                        </p>

                        <div className="mt-auto pt-4">
                            <div className="flex items-end gap-1 mb-4">
                                <span className="text-3xl font-bold text-white">3999 INR</span>
                                <span className="text-gray-500 mb-1">/lifetime</span>
                            </div>
                            <button
                                onClick={handleSimulatePayment}
                                disabled={loading || !!success}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-3 font-medium transition-all flex items-center justify-center gap-2"
                            >
                                Buy Now <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
