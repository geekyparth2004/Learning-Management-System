"use client";

import React from "react";

export default function ContestPlayer(props: any) {
    return (
        <div className="flex h-screen items-center justify-center bg-black text-white">
            <h1 className="text-4xl">Hello World - Isolation Test</h1>
            <pre className="text-xs text-gray-500 mt-4 max-w-lg overflow-auto">
                {JSON.stringify(props, null, 2)}
            </pre>
        </div>
    );
}
