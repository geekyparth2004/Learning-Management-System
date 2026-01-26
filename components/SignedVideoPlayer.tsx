"use client";

import { useEffect, useState } from "react";

interface SignedVideoPlayerProps {
    src: string;
    className?: string;
}

export default function SignedVideoPlayer({ src, className }: SignedVideoPlayerProps) {
    const [videoSrc, setVideoSrc] = useState<string>(src);

    useEffect(() => {
        if (!src) return;

        // Check for R2/Cloudflare protected URLs
        // We use the proxy which handles signing without forcing Content-Type (important for MKV)
        if (src.includes("r2.cloudflarestorage.com") && !src.includes("/api/image-proxy")) {
            try {
                const u = new URL(src);
                const pathParts = u.pathname.split('/');
                // Standard R2 URL path: /bucketName/key or /key depending on domain
                // If using *.r2.cloudflarestorage.com, path is /bucketName/key
                // We extract key assuming standard structure.

                // Logic adapted from course player to ensure consistency
                if (pathParts.length >= 3) {
                    const key = pathParts.slice(2).join('/');
                    setVideoSrc(`/api/image-proxy?key=${encodeURIComponent(key)}`);
                    return;
                }
            } catch (e) {
                console.warn("Failed to parse R2 URL:", src);
            }
        }

        setVideoSrc(src);
    }, [src]);

    return (
        <video
            src={videoSrc}
            controls
            className={`w-full rounded-lg bg-black ${className}`}
            controlsList="nodownload"
        />
    );
}
