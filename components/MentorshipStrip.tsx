"use client";

import React, { useState } from "react";
import Script from "next/script";
import { Coffee, ArrowRight, Loader2, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MentorshipStrip() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleCheckout = async () => {
        setLoading(true);
        setError("");

        try {
            // 1. Create order on the backend specifically for mentorship (99 INR)
            const res = await fetch("/api/mentorship/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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
                description: "1-on-1 Mentorship Session (30 Min)",
                order_id: data.order_id,
                handler: async function (response: any) {
                    setLoading(true);
                    setError("");
                    try {
                        // 3. Verify signature securely
                        const verifyRes = await fetch("/api/mentorship/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        if (verifyRes.ok) {
                            // Redirect to Calendly immediately upon successful payment verification
                            window.location.href = "https://calendly.com/goelparth20049/30min";
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
                    color: "#8b5cf6" // matches purple-500
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
        <div className="relative mt-8 w-full overflow-hidden rounded-2xl border border-purple-500/20 bg-[#111] p-1">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
            
            {/* Background glowing effects */}
            <div className="absolute -left-20 top-0 h-40 w-40 rounded-full bg-purple-600/20 blur-3xl"></div>
            <div className="absolute right-0 bottom-0 h-40 w-40 rounded-full bg-blue-600/20 blur-3xl"></div>

            <div className="relative flex flex-col items-center justify-between gap-6 rounded-xl bg-black/40 p-6 backdrop-blur-sm sm:flex-row sm:p-8">
                <div className="flex items-center gap-6">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/5">
                        <Coffee className="h-8 w-8 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                            Need 1-on-1 Guidance?
                        </h3>
                        <p className="max-w-xl text-sm leading-relaxed text-gray-400">
                            Book a 30-minute personal mentorship session to discuss your career, fix complex bugs, or get architectural advice for your projects.
                        </p>
                    </div>
                </div>

                <div className="flex w-full shrink-0 flex-col items-center gap-3 sm:w-auto sm:items-end">
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold tracking-tight text-white">₹99</span>
                        <span className="text-sm text-gray-400">/ session</span>
                    </div>
                    
                    <button
                        onClick={handleCheckout}
                        disabled={loading}
                        className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:scale-105 hover:shadow-purple-500/40 disabled:opacity-50 sm:w-auto"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Calendar className="h-4 w-4" />
                                Book Mentorship
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </>
                        )}
                    </button>
                    {error && (
                        <p className="text-xs text-red-400 text-center sm:text-right w-full">{error}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
