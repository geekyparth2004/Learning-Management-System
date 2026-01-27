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
                    const relativePath = pathParts.slice(2).join('/');
                    const key = decodeURIComponent(relativePath);

                    let proxyUrl = `/api/image-proxy?key=${encodeURIComponent(key)}`;

                    // Force content-type for MKV files so they play in browser (as WebM)
                    if (key.toLowerCase().endsWith('.mkv')) {
                        proxyUrl += '&contentType=video/webm';
                    }

                    setVideoSrc(proxyUrl);
                    return;
                }
            } catch (e) {
                console.warn("Failed to parse R2 URL:", src);
            }
        }

        setVideoSrc(src);
    }, [src]);

    const isYoutube = src.includes("youtube.com") || src.includes("youtu.be");

    if (isYoutube) {
        const embedUrl = src.replace("watch?v=", "embed/");
        return (
            <iframe
                src={embedUrl}
                className={`w-full aspect-video rounded-lg ${className}`}
                allowFullScreen
            />
        );
    }

    return (
        <video
            src={videoSrc}
            controls
            className={`w-full rounded-lg bg-black ${className}`}
            controlsList="nodownload"
        />
    );
}
