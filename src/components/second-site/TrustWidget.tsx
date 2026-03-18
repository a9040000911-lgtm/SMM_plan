"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart } from "lucide-react";

const MOCK_NAMES = ["Alex", "Maria", "John", "Elena", "Dmitry", "Sarah", "Maxim", "Olga", "James", "Anna"];
const MOCK_SERVICES = [
    "1000 Instagram Likes", "500 Telegram Subs", "2000 YouTube Views",
    "100 TikTok Followers", "5000 Instagram Views", "300 Telegram Reactions"
];
const MOCK_CITIES = ["Moscow", "London", "Dubai", "New York", "Berlin", "Paris", "Toronto", "Kyiv"];
const MOCK_TIMES = ["2 mins ago", "5 mins ago", "Just now", "10 mins ago", "1 min ago"];

interface Notification {
    id: number;
    name: string;
    service: string;
    location: string;
    time: string;
}

export const TrustWidget = () => {
    const [notification, setNotification] = useState<Notification | null>(null);

    useEffect(() => {
        // Initial delay
        const initialTimer = setTimeout(() => {
            triggerNotification();
        }, 5000);

        // Loop
        const interval = setInterval(() => {
            triggerNotification();
        }, Math.random() * 10000 + 15000); // Random interval 15-25s

        return () => {
            clearTimeout(initialTimer);
            clearInterval(interval);
        };
    }, []);

    const triggerNotification = () => {
        const name = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
        const service = MOCK_SERVICES[Math.floor(Math.random() * MOCK_SERVICES.length)];
        const location = MOCK_CITIES[Math.floor(Math.random() * MOCK_CITIES.length)];
        const time = MOCK_TIMES[Math.floor(Math.random() * MOCK_TIMES.length)];

        setNotification({
            id: Date.now(),
            name,
            service,
            location,
            time
        });

        // Hide after 5 seconds
        setTimeout(() => {
            setNotification(null);
        }, 5000);
    };

    return (
        <div className="fixed bottom-4 left-4 z-50 pointer-events-none">
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, x: -50, y: 20 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, x: -50, scale: 0.9 }}
                        className="cyber-box bg-[#0a0c12]/90 border-primary/20 p-4 shadow-2xl backdrop-blur-md flex items-center gap-4 max-w-xs pointer-events-auto"
                    >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary relative">
                            <ShoppingCart size={18} />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-black animate-pulse" />
                        </div>
                        <div className="space-y-1">
                            <div className="text-[11px] font-black text-white uppercase tracking-tight flex items-center gap-2">
                                {notification.name} <span className="text-slate-500 font-normal normal-case">from {notification.location}</span>
                            </div>
                            <div className="text-[10px] text-primary font-bold uppercase tracking-widest leading-none">
                                Bought {notification.service}
                            </div>
                            <div className="text-[9px] text-slate-600 font-mono">
                                {notification.time}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


