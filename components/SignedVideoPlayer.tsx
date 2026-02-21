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

                    // Add provider=r2 to tell proxy to use R2 client/bucket
                    let proxyUrl = `/api/image-proxy?key=${encodeURIComponent(key)}&provider=r2`;

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

    const getYoutubeEmbedUrl = (url: string) => {
        try {
            if (url.includes("embed/")) return url;

            let videoId = "";
            if (url.includes("youtu.be/")) {
                videoId = url.split("youtu.be/")[1]?.split("?")[0];
            } else if (url.includes("v=")) {
                videoId = url.split("v=")[1]?.split("&")[0];
            }

            if (videoId) {
                return `https://www.youtube.com/embed/${videoId}`;
            }
        } catch (e) {
            console.error("Error parsing YouTube URL:", e);
        }
        return url;
    };

    const isYoutube = src.includes("youtube.com") || src.includes("youtu.be");

    if (isYoutube) {
        return (
            <iframe
                src={getYoutubeEmbedUrl(src)}
                className={`w-full aspect-video rounded-lg ${className}`}
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
        );
    }

    return (
        <video
            src={videoSrc}
            controls
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
            className={`w-full rounded-lg bg-black ${className}`}
        />
    );
}
