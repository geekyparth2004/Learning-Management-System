"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import DiscussionPanel from "./DiscussionPanel";

export default function DiscussionButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Floating Chat Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center"
                title="Discussion"
            >
                {isOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <MessageCircle className="w-6 h-6" />
                )}
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-96 h-[500px] bg-[#1a1a1a] border border-gray-700 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                    <DiscussionPanel onClose={() => setIsOpen(false)} />
                </div>
            )}
        </>
    );
}
