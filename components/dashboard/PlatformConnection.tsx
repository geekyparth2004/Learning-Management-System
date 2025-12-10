
"use client";

import { useState } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface PlatformConnectionProps {
    isOpen: boolean;
    onClose: () => void;
    initialData: {
        leetcode?: string | null;
        codeforces?: string | null;
        gfg?: string | null;
    };
    onUpdate: () => void;
}

export default function PlatformConnection({ isOpen, onClose, initialData, onUpdate }: PlatformConnectionProps) {
    const [leetcode, setLeetcode] = useState(initialData.leetcode || "");
    const [codeforces, setCodeforces] = useState(initialData.codeforces || "");
    const [gfg, setGfg] = useState(initialData.gfg || "");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    if (!isOpen) return null;

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/user/platforms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    leetcodeUsername: leetcode,
                    codeforcesUsername: codeforces,
                    gfgUsername: gfg
                })
            });

            if (res.ok) {
                onUpdate();
                onClose();
                router.refresh();
            } else {
                alert("Failed to save profiles.");
            }
        } catch (e) {
            console.error(e);
            alert("Error saving profiles.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-xl border border-[#2e2e2e] bg-[#0a0a0a] shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#2e2e2e] p-4">
                    <h3 className="text-lg font-semibold text-white">Connect Coding Profiles</h3>
                    <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-[#1e1e1e] hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4 p-6">
                    <p className="text-sm text-gray-400">
                        Enter your public usernames to fetch your coding stats.
                    </p>

                    <div className="space-y-2">
                        <label className="block text-xs font-medium uppercase text-gray-500">LeetCode Username</label>
                        <input
                            type="text"
                            value={leetcode}
                            onChange={(e) => setLeetcode(e.target.value)}
                            placeholder="e.g. johndoe"
                            className="w-full rounded bg-[#1e1e1e] p-2 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-medium uppercase text-gray-500">Codeforces Handle</label>
                        <input
                            type="text"
                            value={codeforces}
                            onChange={(e) => setCodeforces(e.target.value)}
                            placeholder="e.g. tourist"
                            className="w-full rounded bg-[#1e1e1e] p-2 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-medium uppercase text-gray-500">GeeksforGeeks Username</label>
                        <input
                            type="text"
                            value={gfg}
                            onChange={(e) => setGfg(e.target.value)}
                            placeholder="e.g. johndoe"
                            className="w-full rounded bg-[#1e1e1e] p-2 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="border-t border-[#2e2e2e] p-4">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Connections
                    </button>
                </div>
            </div>
        </div>
    );
}
