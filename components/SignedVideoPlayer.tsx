"use client";

import { useEffect, useState } from "react";

interface SignedVideoPlayerProps {
    src: string;
    className?: string;
}

export default function SignedVideoPlayer({ src, className }: SignedVideoPlayerProps) {
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        // If it's not a protected URL or already signed, just use it
        if (!src || (!src.includes("r2.cloudflarestorage.com") && !src.includes(".mp4"))) {
            setSignedUrl(src);
            setLoading(false);
            return;
        }

        const fetchSignedUrl = async () => {
            try {
                // Check if we have a valid cached URL in sessionStorage
                const cacheKey = `signed_url_${src}`;
                const cached = sessionStorage.getItem(cacheKey);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    // Check if expired (assuming 1h expiry, we check if < 55 mins old)
                    if (Date.now() - parsed.timestamp < 55 * 60 * 1000) {
                        setSignedUrl(parsed.url);
                        setLoading(false);
                        return;
                    }
                }

                // Fetch new key
                const response = await fetch("/api/video/sign", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url: src }),
                });

                if (!response.ok) throw new Error("Failed to sign URL");

                const data = await response.json();
                setSignedUrl(data.signedUrl);

                // Cache it
                sessionStorage.setItem(cacheKey, JSON.stringify({
                    url: data.signedUrl,
                    timestamp: Date.now()
                }));
            } catch (err) {
                console.error("Error signing video URL:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchSignedUrl();
    }, [src]);

    if (error) {
        return (
            <div className={`flex items-center justify-center bg-gray-900 border border-gray-800 text-red-500 p-4 rounded-lg ${className}`}>
                <p>Failed to load video</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={`flex items-center justify-center bg-gray-900 border border-gray-800 text-gray-500 p-4 rounded-lg ${className}`}>
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                <span>Loading secure video...</span>
            </div>
        );
    }

    // For non-MP4/non-uploaded/external links (like YouTube embeds handled elsewhere or raw iframes)
    // But since this is specific for expected R2/MP4 usage:
    return (
        <video
            src={signedUrl || src}
            controls
            className={`w-full rounded-lg bg-black ${className}`}
            controlsList="nodownload"
        />
    );
}
