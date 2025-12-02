"use client";

import { Github } from "lucide-react";
import { signIn } from "next-auth/react";

export default function GitHubConnect({ isConnected }: { isConnected: boolean }) {
    if (isConnected) {
        return (
            <div className="flex items-center gap-2 rounded-full border border-green-800 bg-green-900/20 px-4 py-2 text-sm text-green-400">
                <Github className="h-4 w-4" />
                <span>GitHub Connected</span>
            </div>
        );
    }

    return (
        <button
            onClick={() => signIn("github")}
            className="flex items-center gap-2 rounded-full border border-gray-800 bg-[#161616] px-4 py-2 text-sm hover:bg-gray-800 transition-colors"
        >
            <Github className="h-4 w-4" />
            <span>Connect GitHub</span>
        </button>
    );
}
