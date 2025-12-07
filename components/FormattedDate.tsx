"use client";

import React, { useEffect, useState } from "react";

interface FormattedDateProps {
    date: string | Date;
    className?: string;
    showTime?: boolean;
}

export default function FormattedDate({ date, className = "", showTime = true }: FormattedDateProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <span className={className}>Loading...</span>; // Or a skeleton, or just UTC server rendered content to avoid hydration mismatch? 
        // Better: render nothing or specific loading state to avoid mismatch error.
        // Actually, common pattern is to render UTC/Server time and swap, but that causes hydration errors.
        // Returning null initially avoids hydration mismatch but causes layout shift.
    }

    const dateObj = new Date(date);
    return (
        <span className={className}>
            {dateObj.toLocaleString(undefined, {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: showTime ? 'numeric' : undefined,
                minute: showTime ? 'numeric' : undefined,
                second: showTime ? 'numeric' : undefined,
            })}
        </span>
    );
}
