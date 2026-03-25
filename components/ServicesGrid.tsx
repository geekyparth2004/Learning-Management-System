"use client";

import React from "react";
import MentorshipStrip from "./MentorshipStrip";
import ResumeStrip from "./ResumeStrip";

export default function ServicesGrid() {
    return (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div className="w-full h-full flex mt-0 [&>div]:mt-0">
                <MentorshipStrip />
            </div>
            <div className="w-full h-full flex mt-0 [&>div]:mt-0">
                <ResumeStrip />
            </div>
        </div>
    );
}
