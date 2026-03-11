"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    // Avoid hydration mismatch
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 opacity-50 cursor-wait">
                <span className="sr-only">Toggle theme</span>
            </button>
        );
    }

    return (
        <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 dark:hover:bg-white/10 hover:bg-black/5 transition-colors text-muted-foreground hover:text-foreground"
            title="Toggle Theme"
        >
            {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
            <span className="sr-only">Toggle theme</span>
        </button>
    );
}
