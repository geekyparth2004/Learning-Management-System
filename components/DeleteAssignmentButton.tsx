"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteAssignmentButtonProps {
    assignmentId: string;
}

export default function DeleteAssignmentButton({ assignmentId }: DeleteAssignmentButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation if inside a Link

        if (!confirm("Are you sure you want to delete this assignment? This action cannot be undone.")) {
            return;
        }

        setIsDeleting(true);

        try {
            const res = await fetch(`/api/assignments/${assignmentId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                throw new Error("Failed to delete assignment");
            }

            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Failed to delete assignment");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 rounded border border-red-900/50 bg-red-900/10 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-900/30 hover:text-red-300 disabled:opacity-50"
        >
            {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Trash2 className="h-4 w-4" />
            )}
            Delete
        </button>
    );
}
