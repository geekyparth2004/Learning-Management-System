"use client";

import React, { Suspense } from "react";
import { CheckCircle, ArrowRight, Calendar } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function PaymentSuccessContent() {
    const searchParams = useSearchParams();
    const type = searchParams.get("type");

    return (
        <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4">
            <div className="max-w-md w-full relative">
                <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-green-500/30 via-emerald-500/20 to-teal-500/30 blur-2xl opacity-60" />
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0c0c14]/90 backdrop-blur-xl p-8 text-center shadow-2xl">
                    <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-12 h-12 text-green-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-4">Payment Successful!</h1>
                    
                    {type === "mentorship" ? (
                        <>
                            <p className="text-gray-400 mb-8 leading-relaxed">
                                Your mentorship session has been confirmed. Please proceed to schedule your 30-minute 1-on-1 session.
                            </p>
                            <a
                                href="https://calendly.com/goelparth20049/30min"
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl py-4 font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(34,197,94,0.3)]"
                            >
                                <Calendar className="w-5 h-5" />
                                Schedule Session
                            </a>
                        </>
                    ) : (
                        <>
                            <p className="text-gray-400 mb-8 leading-relaxed">
                                Your payment has been processed successfully. Your account has been upgraded and all features are now unlocked.
                            </p>
                            <Link
                                href="/"
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl py-4 font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(34,197,94,0.3)]"
                            >
                                Enter Platform
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#050508] flex items-center justify-center"><div className="w-8 h-8 border-2 border-green-500 rounded-full animate-spin border-t-transparent" /></div>}>
            <PaymentSuccessContent />
        </Suspense>
    );
}
