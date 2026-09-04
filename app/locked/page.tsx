"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Lock, Key, CreditCard, ArrowRight, CheckCircle, Crown, Check, Shield, Zap } from "lucide-react";

export default function LockedPage() {
    const router = useRouter();
    const [code, setCode] = useState("");
    const [discountCode, setDiscountCode] = useState("");
    const [computedPrice, setComputedPrice] = useState(3999);

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
                    window.location.href = "/";
                }, 1500);
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async () => {
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            // 1. Create order on the backend with optional discount
            const res = await fetch("/api/razorpay/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ discountCode: discountCode.trim() })
            });

            if (!res.ok) {
                const errText = await res.text();
                setError(errText || "Failed to initialize checkout.");
                setLoading(false);
                return;
            }

            const data = await res.json();

            // 2. Open Razorpay Modal
            const options = {
                key: data.key_id,
                amount: data.amount,
                currency: data.currency,
                name: "KodeCraft",
                description: "KodeCraft Pro — 1 Year Access",
                order_id: data.order_id,
                handler: async function (response: any) {
                    setLoading(true);
                    setError("");
                    try {
                        // 3. Verify signature securely
                        const verifyRes = await fetch("/api/razorpay/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        if (verifyRes.ok) {
                            window.location.href = "/payment-success";
                        } else {
                            const verifyErr = await verifyRes.text();
                            setError(verifyErr || "Payment verification failed.");
                            setLoading(false);
                            window.location.href = "/payment-failed";
                        }
                    } catch (err) {
                        setError("Verification network error.");
                        setLoading(false);
                    }
                },
                theme: {
                    color: "#6366f1" // matches indigo-500
                }
            };

            const rzp = new (window as any).Razorpay(options);

            rzp.on("payment.failed", function (response: any) {
                window.location.href = "/payment-failed";
            });

            rzp.open();

        } catch (err) {
            setError("Network error bridging to payment gateway.");
            setLoading(false);
        }
    };

    const features = [
        "All courses — unlimited access",
        "Live coding contests & leaderboards",
        "Hackathon participation",
        "AI-powered IDE & code assistant",
        "Auto-graded assignments",
        "Practice arena with 500+ problems",
        "Streak tracking & gamification",
        "Certificates on completion",
        "Priority doubt resolution",
        "Job & placement board access",
    ];

    return (
        <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
            <div className="max-w-xl w-full flex flex-col items-center">
                <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
                    <Lock className="w-10 h-10 text-indigo-400" />
                </div>

                <h1 className="text-3xl font-bold text-white mb-2 text-center">Platform Access Locked</h1>
                <p className="text-gray-400 text-center mb-10 max-w-md">
                    Subscribe to KodeCraft Pro to unlock all courses, contests, hackathons, and coding features.
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

                {/* Main Pricing Card */}
                <div className="w-full relative mb-6">
                    <div className="absolute -inset-1 rounded-[1.5rem] bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-cyan-500/20 blur-xl opacity-60" />
                    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c14]/90 backdrop-blur-xl">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                                <Crown className="h-5 w-5 text-amber-300" />
                                <span className="text-lg font-bold text-white">KodeCraft Pro</span>
                            </div>
                            <p className="text-sm text-indigo-200 mt-1">Full platform access — all features unlocked</p>
                        </div>

                        {/* Price */}
                        <div className="px-6 pt-8 pb-4 text-center">
                            <div className="flex items-end justify-center gap-1">
                                <span className="text-lg text-gray-500 line-through">₹9,999</span>
                            </div>
                            <div className="flex items-baseline justify-center gap-1 mt-1">
                                <span className="text-lg text-gray-400">₹</span>
                                <span className="text-5xl font-black tracking-tight bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">
                                    {computedPrice.toLocaleString("en-IN")}
                                </span>
                                <span className="text-lg text-gray-400 ml-1">/year</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                                One-time payment · 12 months access · No auto-renewal
                            </p>
                        </div>

                        {/* Divider */}
                        <div className="mx-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                        {/* Features */}
                        <div className="px-6 py-6">
                            <div className="grid gap-2.5 sm:grid-cols-2">
                                {features.map((feat) => (
                                    <div key={feat} className="flex items-center gap-2.5 text-sm text-gray-300">
                                        <div className="shrink-0 rounded-full bg-emerald-500/10 p-1">
                                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                                        </div>
                                        {feat}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Discount + Buy */}
                        <div className="px-6 pb-6 space-y-4">
                            <input
                                type="text"
                                value={discountCode}
                                onChange={(e) => {
                                    const rawVal = e.target.value;
                                    setDiscountCode(rawVal);
                                    const val = rawVal.toUpperCase().trim();
                                    if (val === "OZI50") setComputedPrice(2499);
                                    else if (val === "KPM012") setComputedPrice(2499);
                                    else if (val === "KPM024") setComputedPrice(3499);
                                    else if (val === "KPM036") setComputedPrice(1999);
                                    else if (val === "IITMADRAS") setComputedPrice(24999);
                                    else setComputedPrice(3999);
                                }}
                                placeholder="Got a discount code?"
                                className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase text-sm"
                                disabled={loading || !!success}
                            />

                            <button
                                onClick={handleCheckout}
                                disabled={loading || !!success}
                                className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-600 hover:via-purple-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-3.5 font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(99,102,241,0.3)]"
                            >
                                <Zap className="w-5 h-5" />
                                {loading && !success ? "Processing..." : "Buy Now"}
                                <ArrowRight className="w-4 h-4" />
                            </button>

                            <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Shield className="h-3.5 w-3.5" />
                                    Secure payment
                                </span>
                                <span>•</span>
                                <span>Razorpay powered</span>
                                <span>•</span>
                                <span>Instant access</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Teacher Referral Code - secondary option */}
                <div className="w-full bg-[#0c0c14]/60 border border-white/[0.06] rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <Key className="w-4 h-4 text-purple-400" />
                        <h2 className="text-sm font-semibold text-white">Have a teacher referral code?</h2>
                    </div>
                    <form onSubmit={handleApplyCode} className="flex gap-3">
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="e.g. TCH-XYZ123"
                            className="flex-1 bg-black border border-gray-800 rounded-xl px-4 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500 uppercase text-sm"
                            disabled={loading || !!success}
                        />
                        <button
                            type="submit"
                            disabled={!code.trim() || loading || !!success}
                            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-5 py-2.5 font-medium transition-all flex items-center gap-2 text-sm shrink-0"
                        >
                            Apply <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
}
