"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, UserPlus } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Registration failed");
            }

            router.push("/login");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0e0e0e] text-white">
            <div className="w-full max-w-md space-y-8 rounded-xl border border-gray-800 bg-[#161616] p-8">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-900/20 text-purple-400">
                        <UserPlus className="h-6 w-6" />
                    </div>
                    <h2 className="text-2xl font-bold">Create Account</h2>
                    <p className="mt-2 text-sm text-gray-400">Join as a Student</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Full Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded border border-gray-700 bg-[#1e1e1e] px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded border border-gray-700 bg-[#1e1e1e] px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded border border-gray-700 bg-[#1e1e1e] px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="rounded bg-red-900/20 p-3 text-center text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded bg-purple-600 py-2.5 font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            "Register"
                        )}
                    </button>
                </form>

                <div className="text-center text-sm text-gray-400">
                    Already have an account?{" "}
                    <Link href="/login" className="text-purple-400 hover:underline">
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
