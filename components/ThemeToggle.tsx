"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="h-9 w-9 rounded border border-gray-800 bg-[#161616]" />
        );
    }

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-9 w-9 items-center justify-center rounded border border-gray-800 bg-[#161616] transition-colors hover:bg-[#1a1a1a] dark:border-gray-800 dark:bg-[#161616] dark:hover:bg-[#1a1a1a]"
            aria-label="Toggle theme"
        >
            {theme === "dark" ? (
                <Sun className="h-4 w-4 text-yellow-400" />
            ) : (
                <Moon className="h-4 w-4 text-blue-400" />
            )}
        </button>
    );
}
