/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { cn } from "@/utils/ui";
import React from "react";

export const BentoGrid = ({
    className,
    children,
}: {
    className?: string;
    children?: React.ReactNode;
}) => {
    return (
        <div
            className={cn(
                "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-4 gap-4 max-w-7xl mx-auto",
                className
            )}
        >
            {children}
        </div>
    );
};

import Link from "next/link";
// ... imports

export const BentoItem = ({
    className,
    title,
    description,
    header,
    icon,
    href,
}: {
    className?: string;
    title?: string | React.ReactNode;
    description?: string | React.ReactNode;
    header?: React.ReactNode;
    icon?: React.ReactNode;
    href?: string;
}) => {
    // If href is present, wrapping content in Link.
    // If not, rendering content directly.

    // Define the card content
    const cardContent = (
        <div
            className={cn(
                "row-span-1 rounded-3xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none p-6 dark:bg-black dark:border-white/[0.2] bg-white border border-transparent flex flex-col justify-between space-y-4 shadow-sm border-zinc-100 h-full",
                "backdrop-blur-xl bg-white/30 dark:bg-black/30 border-white/20", // Glassmorphism
                className
            )}
        >
            {header}
            <div className="group-hover/bento:translate-x-2 transition duration-200">
                {icon}
                <div className="font-sans font-bold text-neutral-600 dark:text-neutral-200 mb-2 mt-2">
                    {title}
                </div>
                <div className="font-sans font-normal text-neutral-600 text-xs dark:text-neutral-300">
                    {description}
                </div>
            </div>
        </div>
    );

    if (href) {
        return (
            <Link href={href} scroll={false} className={cn("block h-full", className && className.includes("col-span") ? className : "")}>
                {/* Re-using card logic via variable might be cleaner but we need to remove col-span from inner if we move it to Link. 
                    Let's just use the variable content but we need to handle className carefully. 
                    The 'className' prop passed to BentoItem usually contains col-span and styling. 
                    When wrapping in Link, Link should take col-span, inner div takes styling.
                    However, for simplicity and to avoid unused var warning, let's just return directly.
                 */}
                {cardContent}
            </Link>
        );
    }

    return cardContent;
};


