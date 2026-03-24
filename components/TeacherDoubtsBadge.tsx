"use client";

import React, { useState, useEffect } from "react";

export default function TeacherDoubtsBadge() {
    const [count, setCount] = useState(0);

    const fetchCount = async () => {
        try {
            // Get teacherId from session (API ignores provided teacherId if it doesn't match session user,
            // but the API endpoint uses session.user.id implicitly if we fetch `/api/doubts?status=PENDING&countOnly=true`)
            // Actually, we modified the API to accept `teacherId` as a manual filter, but since the request
            // comes from the browser, we might just need to pass the teacher's ID. Wait, the API uses the session
            // user's ID to authorize, but passing `teacherId` filters the results.
            
            // Let's first fetch the session to get the teacher ID
            const sessionRes = await fetch("/api/auth/session");
            const session = await sessionRes.json();
            
            if (session?.user?.id) {
                const res = await fetch(`/api/doubts?teacherId=${session.user.id}&status=PENDING&countOnly=true`);
                if (res.ok) {
                    const data = await res.json();
                    setCount(data.count || 0);
                }
            }
        } catch (error) {
            console.error("Failed to fetch pending doubts count", error);
        }
    };

    useEffect(() => {
        fetchCount();
        const interval = setInterval(fetchCount, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    if (count === 0) return null;

    return (
        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {count > 99 ? "99+" : count}
        </span>
    );
}
