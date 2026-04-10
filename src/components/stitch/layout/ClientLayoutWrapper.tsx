"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import React from 'react';
import { usePathname } from 'next/navigation';

export function ClientLayoutWrapper({ 
    children, 
    header, 
    statsSection, 
    footer,
    mobileAppNav,
    floatingActionButtons 
}: { 
    children: React.ReactNode;
    header: React.ReactNode;
    statsSection: React.ReactNode;
    footer: React.ReactNode;
    mobileAppNav: React.ReactNode;
    floatingActionButtons: React.ReactNode;
}) {
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith('/dashboard');

    // Если мы в панели управления, скрываем глобальный хедер, футер и внешний мобильный навбар
    // Это устраняет дублирование логотипов и навигационных элементов (Header + AppNav)
    if (isDashboard) {
        return (
            <>
                <main className="flex flex-col min-h-screen bg-slate-50">
                    {children}
                </main>
                {/* Дашборд использует свой собственный MobileBottomNav из dashboard/layout.tsx */}
                {floatingActionButtons}
            </>
        );
    }

    // Для публичных страниц и каталога возвращаем полную структуру с шапкой
    return (
        <>
            {header}
            <main className="min-h-screen pt-20 pb-20 md:pb-0 flex flex-col bg-white">
                {children}
            </main>
            {floatingActionButtons}
            {statsSection}
            {footer}
            {mobileAppNav}
        </>
    );
}
