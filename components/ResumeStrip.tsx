"use client";

import React, { useState } from "react";
import Script from "next/script";
import { FileText, ArrowRight, Loader2, CheckCircle, Upload } from "lucide-react";

export default function ResumeStrip() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isPaid, setIsPaid] = useState(false);
    
    // Form state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [contact, setContact] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleCheckout = async () => {
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/resume/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) {
                setError("Transaction failed, try again.");
                setLoading(false);
                return;
            }

            const data = await res.json();

            const options = {
                key: data.key_id,
                amount: data.amount,
                currency: data.currency,
                name: "Learning Platform",
                description: "ATS Friendly Resume Drafting",
                order_id: data.order_id,
                handler: async function (response: any) {
                    setLoading(true);
                    setError("");
                    try {
                        const verifyRes = await fetch("/api/resume/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        if (verifyRes.ok) {
                            setIsPaid(true); // Show the form instead of redirecting
                        } else {
                            setError("Transaction failed, try again.");
                            setLoading(false);
                        }
                    } catch (err) {
                        setError("Transaction failed, try again.");
                        setLoading(false);
                    }
                },
                theme: {
                    color: "#0ea5e9" // sky-500
                },
                modal: {
                    ondismiss: function() {
                        setLoading(false);
                        setError("Transaction failed, try again.");
                    }
                }
            };

            const rzp = new (window as any).Razorpay(options);

            rzp.on("payment.failed", function (response: any) {
                setError("Transaction failed, try again.");
                setLoading(false);
            });

            rzp.open();

        } catch (err) {
            setError("Transaction failed, try again.");
            setLoading(false);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !contact || !file) {
            setError("Please fill out all fields and select your resume.");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            // 1. Get presigned URL
            const presignedRes = await fetch("/api/upload/resume", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type || "application/pdf"
                })
            });

            if (!presignedRes.ok) {
                throw new Error("Failed to get upload URL");
            }
            const { uploadUrl, publicUrl } = await presignedRes.json();

            // 2. Upload file directly to S3/R2
            const uploadObjRes = await fetch(uploadUrl, {
                method: "PUT",
                headers: {
                    "Content-Type": file.type || "application/pdf"
                },
                body: file
            });

            if (!uploadObjRes.ok) {
                throw new Error("Failed to upload file");
            }

            // 3. Submit request to db
            const submitRes = await fetch("/api/resume/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    email,
                    contact,
                    resumeUrl: publicUrl
                })
            });

            if (!submitRes.ok) throw new Error("Failed to save request");

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "An error occurred during submission.");
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="relative w-full overflow-hidden rounded-2xl border border-green-500/20 bg-[#111] p-1 h-full flex items-center justify-center min-h-[160px]">
                <div className="absolute inset-0 bg-green-900/10 blur-xl"></div>
                <div className="relative z-10 flex flex-col items-center gap-3 text-center p-6">
                    <CheckCircle className="h-10 w-10 text-green-400" />
                    <h3 className="text-xl font-bold text-white">Request Received!</h3>
                    <p className="text-sm text-gray-400">We will deliver your ATS-friendly resume within 24 hours.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full overflow-hidden rounded-2xl border border-sky-500/20 bg-[#111] p-1 h-full">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
            
            {/* Background glowing effects */}
            <div className="absolute -left-20 top-0 h-40 w-40 rounded-full bg-sky-600/10 blur-3xl"></div>
            <div className="absolute right-0 bottom-0 h-40 w-40 rounded-full bg-blue-600/10 blur-3xl"></div>

            <div className="relative flex min-h-full flex-col justify-between gap-6 rounded-xl bg-black/40 p-6 backdrop-blur-sm sm:p-8">
                
                {!isPaid ? (
                    <>
                        <div className="flex flex-col gap-6 h-full justify-between">
                            <div className="flex items-start gap-4 flex-col sm:flex-row sm:items-center">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-white/5">
                                    <FileText className="h-8 w-8 text-sky-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                        ATS Friendly Resume
                                    </h3>
                                    <p className="text-sm leading-relaxed text-gray-400">
                                        Upload your current resume and our experts will draft an optimized, ATS-friendly version for you within 24hrs.
                                    </p>
                                </div>
                            </div>

                            <div className="flex w-full flex-col sm:flex-row justify-between items-end sm:items-center gap-4 mt-auto">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold tracking-tight text-white">₹299</span>
                                    <span className="text-sm text-gray-400">/ draft</span>
                                </div>
                                
                                <button
                                    onClick={handleCheckout}
                                    disabled={loading}
                                    className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-sky-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition-all hover:scale-105 hover:shadow-sky-500/40 disabled:opacity-50 w-full sm:w-auto"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="h-4 w-4" />
                                            Get Resume Draft
                                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </>
                                    )}
                                </button>
                            </div>
                            {error && (
                                <p className="text-xs text-red-400 text-right w-full">{error}</p>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="border-b border-white/10 pb-3 mb-2">
                            <h3 className="text-lg font-bold text-white">Payment Successful</h3>
                            <p className="text-sm text-gray-400">Please provide your details below.</p>
                        </div>

                        <form onSubmit={handleFormSubmit} className="flex flex-col gap-3">
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-sky-500 transition-colors"
                                required
                            />
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-sky-500 transition-colors"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Contact Number"
                                value={contact}
                                onChange={e => setContact(e.target.value)}
                                className="w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-sky-500 transition-colors"
                                required
                            />
                            
                            <label className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-800 bg-black/50 py-4 hover:border-sky-500/50 hover:bg-black/60 transition-colors">
                                <div className="flex flex-col items-center justify-center gap-1">
                                    <Upload className="h-5 w-5 text-gray-400" />
                                    <p className="text-sm text-gray-400">
                                        {file ? <span className="text-sky-400 font-medium">{file.name}</span> : "Click to upload previous resume (PDF)"}
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.doc,.docx"
                                    onChange={e => e.target.files && setFile(e.target.files[0])}
                                />
                            </label>

                            {error && <p className="text-xs text-red-400">{error}</p>}

                            <button
                                type="submit"
                                disabled={submitting || !file || !name || !email || !contact}
                                className="mt-2 w-full rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                {submitting ? "Uploading & Saving..." : "Submit Details"}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
