"use client";

import React from "react";

interface ContestPlayerProps {
    contest: any;
    problems: any[];
    endTime: string | Date;
    onLeave: () => void;
}

export default function ContestPlayer({ contest, problems, endTime, onLeave }: ContestPlayerProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-900 text-white p-10">
            <h1 className="text-4xl font-bold mb-4">HELLO WORLD DEBUG</h1>
            <p className="mb-4">If you see this, the crash is in the original ContestPlayer logic.</p>
            <div className="bg-black p-4 rounded text-xs font-mono w-full max-w-2xl overflow-auto border border-gray-700">
                <h3 className="font-bold text-yellow-400 mb-2">Contest Data Check:</h3>
                <pre>{JSON.stringify({ ...contest, problems: problems?.length }, null, 2)}</pre>
            </div>
            <button
                onClick={onLeave}
                className="mt-6 px-6 py-2 bg-white text-black font-bold rounded hover:bg-gray-200"
            >
                Leave Contest
            </button>
        </div>
    );
}
