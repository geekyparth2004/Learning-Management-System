"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const PUBLIC_ROUTES = ["/", "/login", "/register", "/locked", "/api"];

export default function SubscriptionGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const checkAccess = async () => {
            // Check if current path is public
            const isPublic = PUBLIC_ROUTES.some((route) => {
                if (route === "/") return pathname === "/";
                return pathname?.startsWith(route);
            });

            if (isPublic) {
                if (isMounted) {
                    setAuthorized(true);
                    setLoading(false);
                }
                return;
            }

            try {
                const res = await fetch("/api/user/subscription");
                if (!res.ok) {
                    if (isMounted) {
                        setAuthorized(true);
                        setLoading(false);
                    }
                    return;
                }

                const user = await res.json();

                // If not logged in, let the standard auth guard or page handle the redirect to login
                if (!user) {
                    if (isMounted) {
                        setAuthorized(true);
                        setLoading(false);
                    }
                    return;
                }

                // Teachers and Admins have full access
                if (user.role === "TEACHER" || user.role === "ADMIN") {
                    if (isMounted) {
                        setAuthorized(true);
                        setLoading(false);
                    }
                    return;
                }

                // Check Subscription
                if (user.subscriptionStatus === "FREE") {
                    router.push("/locked");
                    return;
                }

                if (user.subscriptionStatus === "TRIAL") {
                    if (!user.trialExpiresAt) {
                        router.push("/locked");
                        return;
                    }
                    const trialEnd = new Date(user.trialExpiresAt);
                    if (new Date() > trialEnd) {
                        router.push("/locked");
                        return;
                    }
                }

                if (isMounted) {
                    setAuthorized(true);
                    setLoading(false);
                }
            } catch (error) {
                console.error("Subscription check failed:", error);
                if (isMounted) {
                    setAuthorized(true);
                    setLoading(false);
                }
            }
        };

        checkAccess();

        return () => {
            isMounted = false;
        };
    }, [pathname, router]);

    // Render loading state for protected routes to prevent content flash
    const isPublic = PUBLIC_ROUTES.some((route) => {
        if (route === "/") return pathname === "/";
        return pathname?.startsWith(route);
    });

    if (!isPublic && loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Return null if not authorized on protected route to avoid flash before redirect kicks in
    if (!isPublic && !authorized) {
        return null;
    }

    return <>{children}</>;
}
