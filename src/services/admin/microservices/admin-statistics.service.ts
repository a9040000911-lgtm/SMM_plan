/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from "@/lib/prisma";
import { AdminContext, AdminServiceResult } from "../../types";
import { toPlainObject } from "@/utils/serialization";

export interface DailyChartData {
    date: string;
    orders: number;
    users: number;
    tickets: number;
    revenue: number;
}

export class AdminStatisticsService {
    /**
     * Gets daily chart data for orders, users, tickets, and revenue.
     */
    static async getDailyChartData(ctx: AdminContext, period: '7' | '30' | 'all' = '30'): Promise<AdminServiceResult<DailyChartData[]>> {
        try {
            let dateFilter: any = {};
            if (period !== 'all') {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - parseInt(period, 10));
                dateFilter = { gte: cutoffDate };
            }

            const projectFilter = !ctx.isGlobalAdmin && ctx.allowedProjects.length > 0 
                ? { in: ctx.allowedProjects } 
                : undefined;

            const [ordersRaw, usersRaw, ticketsRaw, revenueRaw] = await Promise.all([
                prisma.order.findMany({
                    where: {
                        ...(projectFilter && { projectId: projectFilter }),
                        ...(period !== 'all' && { createdAt: dateFilter })
                    },
                    select: { createdAt: true }
                }),
                prisma.user.findMany({
                    where: {
                        ...(projectFilter && { projectId: projectFilter }),
                        ...(period !== 'all' && { createdAt: dateFilter })
                    },
                    select: { createdAt: true }
                }),
                prisma.supportTicket.findMany({
                    where: {
                        ...(projectFilter && { projectId: projectFilter }),
                        ...(period !== 'all' && { createdAt: dateFilter })
                    },
                    select: { createdAt: true }
                }),
                prisma.transaction.findMany({
                    where: {
                        status: 'COMPLETED',
                        type: 'DEPOSIT',
                        ...(projectFilter && { user: { projectId: projectFilter } }),
                        ...(period !== 'all' && { createdAt: dateFilter })
                    },
                    select: { createdAt: true, amount: true }
                })
            ]);

            // Merge data by date
            const dateMap = new Map<string, DailyChartData>();

            const ensureDate = (dateOb: Date) => {
                const dateStr = dateOb.toISOString().split('T')[0];
                if (!dateMap.has(dateStr)) {
                    dateMap.set(dateStr, { date: dateStr, orders: 0, users: 0, tickets: 0, revenue: 0 });
                }
                return dateStr;
            };

            for (const o of ordersRaw) {
                const d = ensureDate(o.createdAt);
                dateMap.get(d)!.orders += 1;
            }
            for (const u of usersRaw) {
                const d = ensureDate(u.createdAt);
                dateMap.get(d)!.users += 1;
            }
            for (const t of ticketsRaw) {
                const d = ensureDate(t.createdAt);
                dateMap.get(d)!.tickets += 1;
            }
            for (const r of revenueRaw) {
                const d = ensureDate(r.createdAt);
                dateMap.get(d)!.revenue += Number(r.amount) || 0;
            }

            // Convert to array and sort ascending
            const result = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

            // If period is not 'all', we might want to fill in the missing days with zeros for a smooth chart
            if (period !== 'all' && result.length > 0) {
                const filledResult: DailyChartData[] = [];
                const numDays = parseInt(period, 10);
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(endDate.getDate() - numDays + 1);

                for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                    const dStr = d.toISOString().split('T')[0];
                    const existing = result.find(r => r.date === dStr);
                    if (existing) {
                        filledResult.push(existing);
                    } else {
                        filledResult.push({ date: dStr, orders: 0, users: 0, tickets: 0, revenue: 0 });
                    }
                }
                return { success: true, data: toPlainObject(filledResult) };
            }

            return {
                success: true,
                data: toPlainObject(result)
            };
        } catch (error: any) {
            console.error('Error fetching daily charts:', error);
            return {
                success: false,
                error: { code: 'STATISTICS_FETCH_FAILED', message: error.message }
            };
        }
    }
}
