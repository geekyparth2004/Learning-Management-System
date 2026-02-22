"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Lock, Key, CreditCard, ArrowRight, CheckCircle } from "lucide-react";

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
                name: "Learning Platform",
                description: "Lifetime Premium Subscription",
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
                            setSuccess("Payment successful! Account unlocked.");
                            setTimeout(() => {
                                window.location.href = "/";
                            }, 1500);
                        } else {
                            const verifyErr = await verifyRes.text();
                            setError(verifyErr || "Payment verification failed.");
                            setLoading(false);
                        }
                    } catch (err) {
                        setError("Verification network error.");
                        setLoading(false);
                    }
                },
                theme: {
                    color: "#2563eb" // matches blue-600
                }
            };

            const rzp = new (window as any).Razorpay(options);

            rzp.on("payment.failed", function (response: any) {
                setError("Payment cancelled or failed.");
                setLoading(false);
            });

            rzp.open();

        } catch (err) {
            setError("Network error bridging to payment gateway.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
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

                        <div className="mt-auto pt-4 flex flex-col gap-4">
                            <div>
                                <input
                                    type="text"
                                    value={discountCode}
                                    onChange={(e) => {
                                        const val = e.target.value.toUpperCase();
                                        setDiscountCode(val);
                                        if (val === "KPM012") setComputedPrice(2499);
                                        else if (val === "KPM024") setComputedPrice(3499);
                                        else if (val === "KPM036") setComputedPrice(1999);
                                        else setComputedPrice(3999);
                                    }}
                                    placeholder="Got a discount code?"
                                    className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase text-sm"
                                    disabled={loading || !!success}
                                />
                            </div>

                            <div className="flex items-end gap-1">
                                <span className="text-3xl font-bold text-white">{computedPrice} INR</span>
                                <span className="text-gray-500 mb-1">/lifetime</span>
                            </div>

                            <button
                                onClick={handleCheckout}
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
