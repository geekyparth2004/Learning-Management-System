"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteAssessmentButtonProps {
    id: string;
    title: string;
}

export default function DeleteAssessmentButton({ id, title }: DeleteAssessmentButtonProps) {
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);

    async function handleDelete() {
        if (!confirm(`Delete "${title}"? This also removes all student registrations and scores for it. This cannot be undone.`)) {
            return;
        }

        setDeleting(true);
        try {
            const res = await fetch(`/api/coordinator/assessments/${id}`, { method: "DELETE" });
            if (res.ok) {
                router.refresh();
            } else {
                const data = await res.json().catch(() => ({}));
                alert(data.error || "Failed to delete assessment");
                setDeleting(false);
            }
        } catch {
            alert("Failed to delete assessment");
            setDeleting(false);
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete assessment"
            className="rounded-lg border border-gray-200 p-2 text-gray-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </button>
    );
}
