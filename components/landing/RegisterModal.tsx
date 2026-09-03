"use client";

import React, { useState } from "react";
import { Loader2, UserPlus, X } from "lucide-react";
import { signIn } from "next-auth/react";

interface RegisterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    withPayment: boolean;
}

export default function RegisterModal({ isOpen, onClose, onSuccess, withPayment }: RegisterModalProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [cgpa, setCgpa] = useState("");
    const [batch, setBatch] = useState("");
    const [department, setDepartment] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const normalizedEmail = email.trim();
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email: normalizedEmail, password, phone, cgpa, batch, department }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Registration failed");
            }

            // Auto sign-in after successful registration
            const signInRes = await signIn("credentials", {
                email: normalizedEmail,
                password,
                redirect: false,
            });

            if (signInRes?.error) {
                throw new Error("Failed to sign in automatically. Please login manually.");
            }

            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="relative w-full max-w-md space-y-6 rounded-xl border border-gray-800 bg-[#161616] p-6 shadow-2xl my-auto">
                <button 
                    onClick={onClose}
                    className="absolute right-4 top-4 text-gray-400 hover:text-white"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/20 text-orange-400">
                        <UserPlus className="h-6 w-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Create Account</h2>
                    <p className="mt-2 text-sm text-gray-400">Join to get KodeCraft Pro</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-300">Full Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-lg border border-gray-700 bg-[#1e1e1e] px-4 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-300">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-gray-700 bg-[#1e1e1e] px-4 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-300">Phone Number</label>
                        <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full rounded-lg border border-gray-700 bg-[#1e1e1e] px-4 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                            placeholder="+91XXXXXXXXXX"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-300">Department</label>
                            <input
                                type="text"
                                required
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                className="w-full rounded-lg border border-gray-700 bg-[#1e1e1e] px-4 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                placeholder="e.g. CSE"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-300">Batch Year</label>
                            <input
                                type="text"
                                required
                                value={batch}
                                onChange={(e) => setBatch(e.target.value)}
                                className="w-full rounded-lg border border-gray-700 bg-[#1e1e1e] px-4 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                placeholder="e.g. 2024"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-300">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg border border-gray-700 bg-[#1e1e1e] px-4 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="rounded-lg bg-red-900/20 p-2.5 text-center text-xs text-red-400">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-red-500 via-orange-500 to-red-600 py-2.5 font-bold text-white hover:opacity-90 disabled:opacity-50 mt-2"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            withPayment ? "Register & Continue to Payment" : "Create Account"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
