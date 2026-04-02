"use server";

/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export interface GlobalStats {
    totalOrders: number;
    totalUsers: number;
    onlineUsers: number;
    promoRemaining: number;
    promoTotal: number;
    formatted: {
        orders: string;
        users: string;
    };
}

export const getGlobalStats = unstable_cache(
    async (projectId: string | null): Promise<GlobalStats> => {
        try {
            // Real Database Counts
            const realOrders = await prisma.order.count({ where: projectId ? { projectId } : undefined });
            const realUsers = await prisma.user.count({ where: projectId ? { projectId } : undefined });
            
            const PROMO_CAP = 300;
            // The number of early bird users currently granted to Pioneer status
            const earlyBirdUsers = await prisma.user.count({ 
                where: { 
                    ...(projectId ? { projectId } : {}),
                    isEarlyBird: true 
                } 
            });

            // 1. "Trust" Offset (Marketing Leverage)
            // Add significant offset to real DB so startup looks highly established.
            const BASE_ORDERS = 850000;
            const BASE_USERS = 45000;
            
            const displayOrders = BASE_ORDERS + realOrders;
            const displayUsers = BASE_USERS + realUsers;

            // 2. Online Users (Urgency + Velocity)
            // Time-based peak formula (highest during evening UTC+3)
            const hour = new Date().getUTCHours(); 
            const peakMultiplier = (hour > 10 && hour < 20) ? 1.5 : 1;
            const baseOnline = 120;
            const fluctuation = Math.floor(Math.random() * 80);
            const onlineUsers = Math.floor((baseOnline + fluctuation) * peakMultiplier);

            // 3. EarlyBird Scarcity Logic (FOMO)
            // Reverse-psychology: There are 300 spots. If userCount is low, showing "298 spots left" reduces FOMO.
            // We lock the remaining spots to a low number (e.g., between 7 and 24) to create intense scarcity.
            // When real EarlyBird reaches the cap, it goes to 0 safely.
            const trueRemaining = Math.max(0, PROMO_CAP - earlyBirdUsers);
            let displayRemaining = 0;
            
            if (trueRemaining > 50) {
                // If practically empty, show a high-stress "few spots left" number based on day-of-month noise
                const noise = new Date().getDate() % 5;
                displayRemaining = 12 + noise; // Shows 12-16 spots
            } else if (trueRemaining > 0) {
                // If it's genuinely running out (e.g., 40, 20 left), show real!
                displayRemaining = trueRemaining;
            } else {
                displayRemaining = 0; // Sold out.
            }

            return {
                totalOrders: displayOrders,
                totalUsers: displayUsers,
                onlineUsers,
                promoRemaining: displayRemaining,
                promoTotal: PROMO_CAP,
                formatted: {
                    orders: `~${(displayOrders / 1000).toFixed(1)}k+`,
                    users: `${(displayUsers / 1000).toFixed(1)}k+`
                }
            };

        } catch (e) {
            console.error("[getGlobalStats] Error:", e);
            // Fallback to safe defaults if DB fails
            return {
                totalOrders: 850000,
                totalUsers: 45000,
                onlineUsers: 142,
                promoRemaining: 14,
                promoTotal: 300,
                formatted: {
                    orders: "850k+",
                    users: "45k+"
                }
            };
        }
    },
    ["global-stats"],
    {
        revalidate: 60, // Cache for 60 seconds (prevents DB spam, ensures high TTFB)
        tags: ["global-stats"]
    }
);
