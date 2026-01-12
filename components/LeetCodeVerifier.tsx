import React, { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

interface LeetCodeVerifierProps {
    problemSlug: string;
    onVerified: () => void;
}

export default function LeetCodeVerifier({ problemSlug, onVerified }: LeetCodeVerifierProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleComplete = async () => {
        setIsLoading(true);
        // Simulate a small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 500));
        setSuccess(true);
        onVerified();
        setIsLoading(false);
    };

    if (success) {
        return (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-green-900/20 px-4 py-3 text-green-400 border border-green-900/50">
                <CheckCircle size={20} />
                <span className="font-bold">Marked as Completed!</span>
            </div>
        );
    }

    return (
        <button
            onClick={handleComplete}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-bold hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
            Mark as Completed
        </button>
    );
}
