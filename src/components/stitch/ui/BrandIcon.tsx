"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from "react";
import { cn } from "@/utils/ui";

/**
 * Reusable component for branded SVG logos (Social Media).
 * Derived from official Simple Icons, optimized for Tailwind styling.
 */

type IconName = "telegram" | "vk" | "tiktok" | "youtube" | "likee" | "twitch" | "ok" | "discord" | "twitter" | "generic";

interface BrandIconProps {
    name: IconName;
    className?: string;
    size?: number;
    colorMode?: "white" | "original";
}

export const BrandIcon = ({ name, className, size = 24, colorMode = "white" }: BrandIconProps) => {
    const isOriginal = colorMode === "original";

    const icons: Record<IconName, React.ReactElement> = {
        telegram: (
            <svg viewBox="0 0 24 24" fill="none" className={cn(isOriginal ? "" : "fill-current stroke-none")}>
                {isOriginal && (
                    <defs>
                        <linearGradient id="tg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: "#2AABEE" }} />
                            <stop offset="100%" style={{ stopColor: "#229ED9" }} />
                        </linearGradient>
                    </defs>
                )}
                <circle cx="12" cy="12" r="12" fill={isOriginal ? "url(#tg-grad)" : "currentColor"} />
                <path d="M5.491 11.721l11.082-4.274c.514-.184.957.119.79.883l-1.888 8.892c-.142.64-.523.797-1.059.497l-2.875-2.118-1.387 1.334c-.153.153-.282.282-.577.282l.206-2.923 5.322-4.809c.231-.205-.05-.319-.36-.114L8.33 13.784l-2.834-.886c-.616-.192-.628-.616.128-.911l-.133.004z" fill="white" />
            </svg>
        ),
        vk: (
            <svg viewBox="0 0 24 24" fill="none" className={cn(isOriginal ? "" : "fill-current stroke-none")}>
                <rect width="24" height="24" rx="12" fill={isOriginal ? "#4C75A3" : "currentColor"} />
                <path d="M13.162 18.994c-5.674 0-8.913-3.886-9.05-10.334h2.825c.095 4.73 2.181 6.734 3.836 7.147v-7.147h2.662v4.085c1.63-.175 3.321-2.022 3.889-4.085h2.662c-.414 2.532-2.28 4.379-3.606 5.147 1.326.621 3.511 2.185 4.364 5.187h-2.915c-.669-2.083-2.329-3.7-4.467-3.914v3.914h-.001z" fill="white" />
            </svg>
        ),
        tiktok: (
            <svg viewBox="0 0 24 24" fill="none" className={cn(isOriginal ? "" : "fill-current stroke-none")}>
                <rect width="24" height="24" rx="12" fill={isOriginal ? "#000000" : "currentColor"} />
                <path d="M16.48 5.76a4.406 4.406 0 0 1-1.32 3.42 4.414 4.414 0 0 1-3.16 1.3V19.2c-1.31 0-2.6.53-3.53 1.47-.93.94-1.46 2.22-1.46 3.53 0 .8.19 1.58.55 2.29.36.71.9 1.32 1.56 1.76a5.04 5.04 0 0 0 5.4 0c.66-.44 1.2-1.05 1.56-1.76.36-.71.55-1.49.55-2.29v-6.72a6.96 6.96 0 0 0 4.08 1.44v-4.08c-1.04-.04-2.04-.44-2.83-1.13-.79-.69-1.32-1.63-1.49-2.67l.14-.02V5.76z" fill={isOriginal ? "#25F4EE" : "white"} transform="translate(-2, -4)" />
                <path d="M14.48 4.76a4.406 4.406 0 0 1-1.32 3.42 4.414 4.414 0 0 1-3.16 1.3V18.2c-1.31 0-2.6.53-3.53 1.47-.93.94-1.46 2.22-1.46 3.53 0 .8.19 1.58.55 2.29.36.71.9 1.32 1.56 1.76a5.04 5.04 0 0 0 5.4 0c.66-.44 1.2-1.05 1.56-1.76.36-.71.55-1.49.55-2.29V16.72a6.96 6.96 0 0 0 4.08 1.44v-4.08c-1.04-.04-2.04-.44-2.83-1.13-.79-.69-1.32-1.63-1.49-2.67l.14-.02V4.76z" fill={isOriginal ? "#FE2C55" : "white"} transform="translate(0, 0)" />
            </svg>
        ),
        youtube: (
            <svg viewBox="0 0 24 24" fill="none" className={cn(isOriginal ? "" : "fill-current stroke-none")}>
                <rect width="24" height="24" rx="12" fill={isOriginal ? "#FF0000" : "currentColor"} />
                <path d="M16 12l-6 3.5v-7L16 12z" fill="white" />
            </svg>
        ),
        likee: (
            <svg viewBox="0 0 24 24" fill="none" className={cn(isOriginal ? "" : "fill-current stroke-none")}>
                {isOriginal && (
                    <defs>
                        <linearGradient id="likee-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: "#FF5E62" }} />
                            <stop offset="100%" style={{ stopColor: "#FF9966" }} />
                        </linearGradient>
                    </defs>
                )}
                <rect width="24" height="24" rx="12" fill={isOriginal ? "url(#likee-grad)" : "currentColor"} />
                <path d="M12 17.5c-2.5-2.5-4.5-5.5-4.5-7.5s2-3.5 4.5-3.5 4.5 1.5 4.5 3.5-2 5-4.5 7.5z" fill="white" />
            </svg>
        ),
        twitch: (
            <svg viewBox="0 0 24 24" fill="none" className={cn(isOriginal ? "" : "fill-current stroke-none")}>
                <rect width="24" height="24" rx="12" fill={isOriginal ? "#9146FF" : "currentColor"} />
                <path d="M7 6v10h3v3l3-3h2.5L18 13.5V6H7zm9.5 6.5l-2 2H12l-2 2v-2H8.5V7.5h8v5.5zM14 9h1.5v3H14V9zm-3.5 0H12v3h-1.5V9z" fill="white" />
            </svg>
        ),
        ok: (
            <svg viewBox="0 0 24 24" fill="none" className={cn(isOriginal ? "" : "fill-current stroke-none")}>
                <rect width="24" height="24" rx="12" fill={isOriginal ? "#F97400" : "currentColor"} />
                <path d="M12 11c1.38 0 2.5-1.12 2.5-2.5S13.38 6 12 6s-2.5 1.12-2.5 2.5S10.62 11 12 11zm0-3.5c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 5c-2.43 0-4.51 1.25-5.69 3.12-.13.2-.08.48.12.62.2.14.48.08.62-.12 1.05-1.66 2.87-2.62 4.95-2.62s3.9 1 4.95 2.62c.14.22.42.27.62.12.2-.14.25-.42.12-.62-1.18-1.87-3.26-3.12-5.69-3.12z" fill="white" />
            </svg>
        ),
        generic: (
            <svg viewBox="0 0 24 24" fill="none" className={cn(isOriginal ? "" : "fill-current stroke-none")}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        ),
        discord: (
            <svg viewBox="0 0 24 24" fill="none" className={cn(isOriginal ? "" : "fill-current stroke-none")}>
                <rect width="24" height="24" rx="12" fill={isOriginal ? "#5865F2" : "currentColor"} />
                <path d="M17.48 7.5c-1.29-.4-2.83-.6-4.48-.6s-3.19.2-4.48.6l-.3 1.2c2.1-.6 4.6-.6 6.7 0l-.3-1.2zm-2.48 4.2c-1.18 0-2 .82-2 2s.82 2 2 2 2-.82 2-2-.82-2-2-2zM9 11.7c-1.18 0-2 .82-2 2s.82 2 2 2 2-.82 2-2-.82-2-2-2z" fill="white" />
            </svg>
        ),
        twitter: (
            <svg viewBox="0 0 24 24" fill="none" className={cn(isOriginal ? "" : "fill-current stroke-none")}>
                <rect width="24" height="24" rx="12" fill={isOriginal ? "#000000" : "currentColor"} />
                <path d="M15.5 6h2.5l-5.5 6 6 7.5h-5.5L9.5 14l-4.5 5.5H2.5l6-6.5-5.5-7h5.5l3 4 4-5.5zm-1 11h1.5L7.5 7h-1.5L14.5 17z" fill="white" />
            </svg>
        ),
    };

    return (
        <div
            className={cn("inline-flex items-center justify-center overflow-hidden shrink-0", className)}
            style={{ width: size, height: size }}
        >
            {icons[name] || <div className="w-full h-full bg-slate-100 rounded-full" />}
        </div>
    );
};


