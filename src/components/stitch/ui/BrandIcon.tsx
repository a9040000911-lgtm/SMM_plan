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

type IconName = "telegram" | "tg" | "vk" | "vkontakte" | "odnoklassniki" | "twitter-x" | "tiktok" | "youtube" | "yt" | "instagram" | "inst" | "likee" | "twitch" | "ok" | "discord" | "twitter" | "facebook" | "fb" | "threads" | "reddit" | "whatsapp" | "spotify" | "soundcloud" | "linkedin" | "pinterest" | "snapchat" | "kick" | "rutube" | "dzen" | "appstore" | "googleplay" | "steam" | "google" | "trovo" | "max" | "yandex" | "web" | "generic";

interface BrandIconProps {
    name: IconName | string;
    className?: string;
    size?: number;
    colorMode?: "white" | "original";
}

export const BrandIcon = ({ name, className, size = 24, colorMode = "white" }: BrandIconProps) => {
    const isOriginal = colorMode === "original";

    const iconFiles: Record<IconName, string> = {
        telegram: "/brands/telegram.svg",
        tg: "/brands/telegram.svg",
        vk: "/brands/vk.svg",
        tiktok: "/brands/tiktok.svg",
        youtube: "/brands/youtube.svg",
        yt: "/brands/youtube.svg",
        instagram: "/brands/instagram.svg",
        inst: "/brands/instagram.svg",
        likee: "/brands/likee.svg", // Placeholder if not found
        twitch: "/brands/twitch.svg",
        ok: "/brands/ok.svg",
        discord: "/brands/discord.svg",
        twitter: "/brands/x.svg",
        reddit: "/brands/reddit.svg",
        whatsapp: "/brands/whatsapp.svg",
        spotify: "/brands/spotify.svg",
        soundcloud: "/brands/soundcloud.svg",
        linkedin: "/brands/linkedin.svg",
        pinterest: "/brands/pinterest.svg",
        snapchat: "/brands/snapchat.svg",
        threads: "/brands/threads.svg",
        facebook: "/brands/facebook.svg",
        fb: "/brands/facebook.svg",
        kick: "/brands/kick.svg",
        rutube: "/brands/rutube.svg",
        dzen: "/brands/dzen.svg",
        appstore: "/brands/appstore.svg",
        googleplay: "/brands/googleplay.svg",
        steam: "/brands/steam.svg",
        google: "/brands/google.svg",
        trovo: "/brands/trovo.svg",
        max: "/brands/max.svg",
        yandex: "/brands/yandex.svg",
        web: "/brands/web.svg",
        generic: "/brands/generic.svg",
        vkontakte: "/brands/vk.svg",
        odnoklassniki: "/brands/ok.svg",
        "twitter-x": "/brands/x.svg"
    };

    const src = iconFiles[name as IconName] || iconFiles.generic;

    return (
        <span 
            className={cn("relative flex items-center justify-center shrink-0", className)}
            style={{ width: size, height: size }}
        >
            <img 
                src={src} 
                alt={name}
                className={cn(
                    "w-full h-full object-contain transition-all duration-300",
                    colorMode === "white" && "brightness-0 invert opacity-90",
                    colorMode === "original" ? "" : "grayscale-0"
                )}
                onError={(e) => {
                    // Fallback to a generic circle if file missing
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3C/svg%3E";
                }}
            />
        </span>
);
};


