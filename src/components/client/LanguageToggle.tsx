"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import * as React from "react";
import { useLanguage } from "@/providers/language-provider";
import { Globe } from "lucide-react";

export function LanguageToggle() {
    const { lang, setLang } = useLanguage();

    // Avoid hydration mismatch logic is inside provider, but button label might flicker.
    // Client-side only rendering usually safer for localstorage dependent items, or separate handling.
    // For simplicity, we just toggle.

    return (
        <button
            onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 dark:hover:bg-white/10 hover:bg-black/5 transition-colors text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground"
            title="Switch Language"
        >
            <Globe size={14} />
            {lang === 'ru' ? 'RU' : 'EN'}
        </button>
    );
}


