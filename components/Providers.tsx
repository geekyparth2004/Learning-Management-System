"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        document.addEventListener("contextmenu", handleContextMenu);
        
        return () => {
            document.removeEventListener("contextmenu", handleContextMenu);
        };
    }, []);

    return <SessionProvider>{children}</SessionProvider>;
}
