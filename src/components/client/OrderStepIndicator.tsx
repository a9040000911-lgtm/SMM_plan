"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from "react";
import { motion } from "framer-motion";
import { Check, Link2, LayoutGrid, Zap, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderStepIndicatorProps {
    currentStep: "IDLE" | "SELECT_CATEGORY" | "SELECT_SERVICE" | "CHECKOUT";
}

const steps = [
    { id: "IDLE", label: "Ссылка", icon: Link2 },
    { id: "SELECT_CATEGORY", label: "Категории", icon: LayoutGrid },
    { id: "SELECT_SERVICE", label: "Тарифы", icon: Zap },
    { id: "CHECKOUT", label: "Оплата", icon: CreditCard },
];

export const OrderStepIndicator: React.FC<OrderStepIndicatorProps> = ({ currentStep }) => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);

    return (
        <div className="w-full max-w-2xl mx-auto mb-12">
            <div className="relative flex justify-between">
                {/* Progress Line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 z-0" />
                <motion.div
                    className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0"
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                />

                {steps.map((step, idx) => {
                    const isActive = idx <= currentIndex;
                    const isCurrent = idx === currentIndex;
                    const Icon = step.icon;

                    return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                            <motion.div
                                animate={{
                                    scale: isCurrent ? 1.1 : 1,
                                    backgroundColor: isActive ? "var(--primary)" : "var(--background)",
                                    borderColor: isActive ? "var(--primary)" : "var(--border)"
                                }}
                                className={cn(
                                    "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors",
                                    isActive ? "text-primary-foreground" : "text-muted-foreground"
                                )}
                            >
                                {idx < currentIndex ? <Check size={18} /> : <Icon size={18} />}
                            </motion.div>
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest transition-colors",
                                isActive ? "text-foreground" : "text-muted-foreground/50"
                            )}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
