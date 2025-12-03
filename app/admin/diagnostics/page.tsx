"use client";

import { useState } from "react";

export default function DiagnosticsPage() {
    const [logs, setLogs] = useState<string[]>([]);
    const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

    const runDiagnostics = async () => {
        setLogs([]);
        setStatus("running");
        addLog("Starting Diagnostics...");

        try {
            // 1. Check API Route
            addLog("Step 1: Checking Presigned URL API...");
            const res = await fetch("/api/upload/presigned-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename: "test-diagnostic.txt", contentType: "text/plain" })
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`API Error (${res.status}): ${errText}`);
            }

            const data = await res.json();
            addLog(`✅ API Success! Upload URL generated.`);
            addLog(`URL Host: ${new URL(data.uploadUrl).host}`);

            // 2. Test Upload (Small File)
            addLog("Step 2: Testing Upload (Small Text File)...");
            const file = new File(["Diagnostic Test Content"], "test-diagnostic.txt", { type: "text/plain" });

            const uploadRes = await fetch(data.uploadUrl, {
                method: "PUT",
                body: file,
                headers: { "Content-Type": "text/plain" }
            });

            if (!uploadRes.ok) {
                throw new Error(`Upload Failed (${uploadRes.status}): ${uploadRes.statusText}`);
            }

            addLog("✅ Upload Success!");
            setStatus("success");

        } catch (error: any) {
            addLog(`❌ ERROR: ${error.message}`);
            setStatus("error");
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Upload Diagnostics</h1>
            <button
                onClick={runDiagnostics}
                disabled={status === "running"}
                className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
                {status === "running" ? "Running..." : "Run Diagnostics"}
            </button>

            <div className="mt-6 bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-96 overflow-auto">
                {logs.length === 0 ? "Ready to run." : logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
        </div>
    );
}
