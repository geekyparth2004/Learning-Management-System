"use client";

import { useEffect, useState } from "react";
import { BADGE_DEFINITIONS, BadgeType } from "@/lib/badges";

interface BadgeCelebrationProps {
    badgeType: BadgeType;
    onComplete: () => void;
}

export default function BadgeCelebration({ badgeType, onComplete }: BadgeCelebrationProps) {
    const [phase, setPhase] = useState<"animation" | "reveal">("animation");
    const badge = BADGE_DEFINITIONS[badgeType];

    useEffect(() => {
        // After 10 seconds, show the badge reveal
        const timer = setTimeout(() => {
            setPhase("reveal");
        }, 10000);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (phase === "reveal") {
            // Auto-close after 5 more seconds
            const timer = setTimeout(onComplete, 5000);
            return () => clearTimeout(timer);
        }
    }, [phase, onComplete]);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm">
            {phase === "animation" && (
                <div className="relative">
                    {/* Heroic Animation Phase */}
                    <div className="flex flex-col items-center gap-8">
                        {/* Pulsing rings */}
                        <div className="relative">
                            <div className="absolute inset-0 animate-ping rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 opacity-20" style={{ width: 300, height: 300, marginLeft: -150, marginTop: -150 }} />
                            <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-30" style={{ width: 200, height: 200, marginLeft: -100, marginTop: -100, animationDelay: '0.5s' }} />

                            {/* Central glow */}
                            <div className="relative h-40 w-40 animate-pulse rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 shadow-[0_0_100px_50px_rgba(255,165,0,0.5)]" />
                        </div>

                        {/* Particle effects */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            {[...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute w-2 h-2 rounded-full bg-yellow-400 animate-float"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`,
                                        animationDelay: `${Math.random() * 2}s`,
                                        animationDuration: `${2 + Math.random() * 3}s`
                                    }}
                                />
                            ))}
                        </div>

                        {/* Text */}
                        <div className="text-center animate-bounce">
                            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 animate-pulse">
                                🎉 ACHIEVEMENT UNLOCKED 🎉
                            </p>
                            <p className="text-xl text-gray-400 mt-2">Something amazing is coming...</p>
                        </div>
                    </div>
                </div>
            )}

            {phase === "reveal" && (
                <div className="flex flex-col items-center gap-8 animate-fade-in">
                    {/* Badge Image */}
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 blur-3xl opacity-50 animate-pulse" />
                        <img
                            src={badge.image}
                            alt={badge.title}
                            className="relative w-64 h-64 object-contain drop-shadow-[0_0_50px_rgba(255,165,0,0.8)] animate-scale-in"
                        />
                    </div>

                    {/* Congratulations Message */}
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500">
                            🏆 CONGRATULATIONS! 🏆
                        </h1>
                        <h2 className="text-3xl font-bold text-white">
                            {badge.title}
                        </h2>
                        <p className="text-xl text-gray-300">
                            {badge.description}
                        </p>
                    </div>

                    {/* Close button */}
                    <button
                        onClick={onComplete}
                        className="mt-4 px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full font-bold text-black hover:scale-105 transition-transform"
                    >
                        Continue
                    </button>
                </div>
            )}

            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    50% { transform: translateY(-100px) rotate(180deg); opacity: 0.5; }
                }
                @keyframes scale-in {
                    0% { transform: scale(0) rotate(-180deg); opacity: 0; }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
                @keyframes fade-in {
                    0% { opacity: 0; }
                    100% { opacity: 1; }
                }
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
                .animate-scale-in {
                    animation: scale-in 1s ease-out forwards;
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
