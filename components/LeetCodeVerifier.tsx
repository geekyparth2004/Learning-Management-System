import React, { useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface LeetCodeVerifierProps {
    problemSlug: string;
    onVerified: () => void;
}

export default function LeetCodeVerifier({ problemSlug, onVerified }: LeetCodeVerifierProps) {
    const [username, setUsername] = useState("");
    const [isLinking, setIsLinking] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const linkAccount = async () => {
        if (!username) return;
        setIsLinking(true);
        setError("");
        try {
            const res = await fetch("/api/user/leetcode", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username }),
            });
            if (!res.ok) throw new Error("Failed to link account");
            verifySubmission();
        } catch (e) {
            setError("Failed to link LeetCode account");
        } finally {
            setIsLinking(false);
        }
    };

    const verifySubmission = async () => {
        setIsVerifying(true);
        setError("");
        try {
            const res = await fetch("/api/verify-leetcode", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ problemSlug }),
            });
            const data = await res.json();

            if (data.error === "LeetCode username not linked") {
                // Prompt for username
                setError("Please link your LeetCode username first");
            } else if (data.verified) {
                setSuccess(true);
                onVerified();
            } else {
                setError(data.message || "Verification failed. Make sure you submitted successfully on LeetCode recently.");
            }
        } catch (e) {
            setError("Verification system error");
        } finally {
            setIsVerifying(false);
        }
    };

    if (success) {
        return (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-green-900/20 px-4 py-3 text-green-400 border border-green-900/50">
                <CheckCircle size={20} />
                <span className="font-bold">Verified & Completed!</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {error === "Please link your LeetCode username first" ? (
                <div className="space-y-2">
                    <input
                        type="text"
                        placeholder="LeetCode Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full rounded-lg border border-gray-700 bg-[#1e1e1e] px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                    />
                    <button
                        onClick={linkAccount}
                        disabled={isLinking}
                        className="w-full rounded-lg bg-blue-600 px-4 py-2 font-bold hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isLinking ? "Linking..." : "Connect & Verify"}
                    </button>
                </div>
            ) : (
                <button
                    onClick={verifySubmission}
                    disabled={isVerifying}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-bold hover:bg-green-700 disabled:opacity-50"
                >
                    {isVerifying ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                    Verify Completion
                </button>
            )}

            {error && error !== "Please link your LeetCode username first" && (
                <div className="flex items-center justify-center gap-2 text-sm text-red-400">
                    <XCircle size={14} /> {error}
                </div>
            )}
        </div>
    );
}
