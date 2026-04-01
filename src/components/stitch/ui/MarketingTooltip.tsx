"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/ui";

interface MarketingTooltipProps {
    isVisible: boolean;
    content: string;
    position?: "top" | "bottom" | "left" | "right";
    offset?: number;
    maxWidth?: string;
    className?: string;
    children: React.ReactNode;
}

export function MarketingTooltip({ 
    isVisible, 
    content, 
    position = "top", 
    offset = 12,
    maxWidth = "280px",
    className,
    children 
}: MarketingTooltipProps) {
    const variants = {
        initial: { 
            opacity: 0, 
            scale: 0.95, 
            y: position === "top" ? 8 : -8,
            x: (position === "left" || position === "right") ? (position === "left" ? 8 : -8) : 0
        },
        animate: { opacity: 1, scale: 1, y: 0, x: 0 },
        exit: { 
            opacity: 0, 
            scale: 0.95, 
            y: position === "top" ? 8 : -8,
            transition: { duration: 0.15 }
        }
    };

    const arrowPosition = {
        top: `bottom-[-4px] left-1/2 -translate-x-1/2 border-t-blue-600 border-l-transparent border-r-transparent border-b-transparent`,
        bottom: `top-[-4px] left-1/2 -translate-x-1/2 border-b-blue-600 border-l-transparent border-r-transparent border-t-transparent`,
        left: `right-[-4px] top-1/2 -translate-y-1/2 border-l-blue-600 border-t-transparent border-b-transparent border-r-transparent`,
        right: `left-[-4px] top-1/2 -translate-y-1/2 border-r-blue-600 border-t-transparent border-b-transparent border-l-transparent`
    };

    const tooltipPlacement = {
        top: `bottom-full left-1/2 -translate-x-1/2`,
        bottom: `top-full left-1/2 -translate-x-1/2`,
        left: `right-full top-1/2 -translate-y-1/2`,
        right: `left-full top-1/2 -translate-y-1/2`
    };

    // Correcting margin based on position
    const marginClasses = {
        top: { marginBottom: `${offset}px` },
        bottom: { marginTop: `${offset}px` },
        left: { marginRight: `${offset}px` },
        right: { marginLeft: `${offset}px` }
    };

    return (
        <div className="relative inline-block w-full">
            <AnimatePresence mode="wait">
                {isVisible && (
                    <motion.div
                        variants={variants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        style={{ ...marginClasses[position], maxWidth }}
                        className={cn(
                            "absolute z-[100] pointer-events-none",
                            tooltipPlacement[position],
                            className
                        )}
                    >
                        <div className="bg-blue-600 text-white text-[10px] sm:text-[11px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl shadow-2xl shadow-blue-500/20 flex items-center gap-2.5 border border-blue-400/20">
                            <motion.div 
                                animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }} 
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]" 
                            />
                            <span className="leading-tight text-center sm:text-left">{content}</span>
                            <div className={cn("absolute border-[4px]", arrowPosition[position])} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {children}
        </div>
    );
}
