"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ProblemBuilder from "@/components/ProblemBuilder";

export default function CreatePracticeProblemPage() {
    const router = useRouter();
    const [isUploading, setIsUploading] = useState(false);

    const handleUploadVideo = async (file: File) => {
        setIsUploading(true);
        try {
            const res = await fetch("/api/upload/presigned-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename: file.name, contentType: file.type }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Upload failed");

            const { uploadUrl, publicUrl } = data;

            await fetch(uploadUrl, {
                method: "PUT",
                body: file,
                headers: { "Content-Type": file.type }
            });

            return publicUrl;
        } catch (e: any) {
            console.error("Upload failed", e);
            throw new Error(e.message || "Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async (problemData: any) => {
        try {
            const res = await fetch("/api/practice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(problemData)
            });

            if (res.ok) {
                router.push("/teacher/practice");
                router.refresh();
            } else {
                alert("Failed to create practice problem");
            }
        } catch (error) {
            console.error(error);
            alert("Error creating problem");
        }
    };

    return (
        <div className="min-h-screen bg-[#0e0e0e] text-white">
            {/* Uses ProblemBuilder directly in fullscreen modal mode */}
            <ProblemBuilder
                onSave={handleSave}
                onCancel={() => router.push("/teacher/practice")}
                uploadVideo={handleUploadVideo}
                isUploading={isUploading}
            />
        </div>
    );
}
