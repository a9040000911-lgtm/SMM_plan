"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Locale, dictionaries, Dictionary } from '@/i18n/dictionaries';

interface LanguageContextType {
    lang: Locale;
    setLang: (lang: Locale) => void;
    t: Dictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLangState] = useState<Locale>('ru');

    useEffect(() => {
        const saved = localStorage.getItem('smmplan_lang') as Locale;
        if (saved && (saved === 'ru' || saved === 'en')) {
            setLangState(saved);
        }
    }, []);

    const setLang = (newLang: Locale) => {
        setLangState(newLang);
        localStorage.setItem('smmplan_lang', newLang);
        document.cookie = `smmplan_lang=${newLang}; path=/; max-age=31536000`; // 1 year
    };

    const t = dictionaries[lang];

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}


