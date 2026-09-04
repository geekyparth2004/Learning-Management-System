"use client";

import React, { Suspense } from "react";
import { XCircle, RefreshCcw, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function PaymentFailedContent() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4">
            <div className="max-w-md w-full relative">
                <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-red-500/30 via-rose-500/20 to-orange-500/30 blur-2xl opacity-60" />
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0c0c14]/90 backdrop-blur-xl p-8 text-center shadow-2xl">
                    <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <XCircle className="w-12 h-12 text-red-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-4">Payment Failed</h1>
                    
                    <p className="text-gray-400 mb-8 leading-relaxed">
                        We couldn't process your transaction. Your account has not been charged. Please try again or use a different payment method.
                    </p>
                    
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => router.back()}
                            className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl py-4 font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                        >
                            <RefreshCcw className="w-5 h-5" />
                            Try Again
                        </button>
                        <Link
                            href="/"
                            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl py-4 font-bold transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Return Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PaymentFailedPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#050508] flex items-center justify-center"><div className="w-8 h-8 border-2 border-red-500 rounded-full animate-spin border-t-transparent" /></div>}>
            <PaymentFailedContent />
        </Suspense>
    );
}
