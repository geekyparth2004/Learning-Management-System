"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, LogIn } from "lucide-react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid credentials");
            } else {
                router.push("/");
                router.refresh();
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0e0e0e] text-white">
            <div className="w-full max-w-md space-y-8 rounded-xl border border-gray-800 bg-[#161616] p-8">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-900/20 text-blue-400">
                        <LogIn className="h-6 w-6" />
                    </div>
                    <h2 className="text-2xl font-bold">Welcome Back</h2>
                    <p className="mt-2 text-sm text-gray-400">Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded border border-gray-700 bg-[#1e1e1e] px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
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
                            className="w-full rounded border border-gray-700 bg-[#1e1e1e] px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
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
                        className="flex w-full items-center justify-center gap-2 rounded bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            "Sign In"
                        )}
                    </button>
                </form>

                <div className="text-center text-sm text-gray-400">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="text-blue-400 hover:underline">
                        Register
                    </Link>
                </div>
            </div>
        </div>
    );
}
