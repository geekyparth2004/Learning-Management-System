"use client";

import React, { useEffect, useState } from "react";
import { Plus, Copy, CheckCircle, Ticket, Users, Clock } from "lucide-react";

interface ReferralCode {
    id: string;
    code: string;
    createdAt: string;
}

export default function TeacherReferralsPage() {
    const [codes, setCodes] = useState<ReferralCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const fetchCodes = async () => {
        try {
            const res = await fetch("/api/teacher/referrals");
            if (res.ok) {
                const data = await res.json();
                setCodes(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCodes();
    }, []);

    const generateCode = async () => {
        setGenerating(true);
        try {
            const res = await fetch("/api/teacher/referrals", {
                method: "POST"
            });
            if (res.ok) {
                await fetchCodes();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setGenerating(false);
        }
    };

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Ticket className="w-8 h-8 text-blue-500" />
                        Referral Codes
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Generate codes to grant your students a 4-day premium trial free of charge.
                    </p>
                </div>
                <button
                    onClick={generateCode}
                    disabled={generating}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    {generating ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    ) : (
                        <Plus className="w-5 h-5" />
                    )}
                    Generate New Code
                </button>
            </div>

            <div className="bg-[#111111] border border-gray-800 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading your codes...</div>
                ) : codes.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <Ticket className="w-12 h-12 text-gray-700 mb-4" />
                        <h3 className="text-xl text-white font-medium mb-2">No active referral codes</h3>
                        <p className="text-gray-500 max-w-sm">You haven't generated any referral codes yet. Click the button above to create one.</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-800 bg-[#0a0a0a]">
                                <th className="p-4 text-sm font-semibold text-gray-400">REFERRAL CODE</th>
                                <th className="p-4 text-sm font-semibold text-gray-400">CREATED AT</th>
                                <th className="p-4 text-sm font-semibold text-gray-400 text-right">ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {codes.map((code) => (
                                <tr key={code.id} className="border-b border-gray-800/50 hover:bg-[#1a1a1a] transition-colors">
                                    <td className="p-4">
                                        <div className="inline-flex items-center gap-2 bg-[#1a1a1a] border border-gray-700 px-3 py-1.5 rounded-lg text-white font-mono text-lg tracking-wider">
                                            {code.code}
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            {new Date(code.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => copyToClipboard(code.code)}
                                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors inline-flex items-center gap-2 outline-none"
                                            title="Copy Code"
                                        >
                                            {copiedCode === code.code ? (
                                                <>
                                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                                    <span className="text-green-500 text-sm font-medium">Copied!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-5 h-5" />
                                                    <span className="text-sm">Copy</span>
                                                </>
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
