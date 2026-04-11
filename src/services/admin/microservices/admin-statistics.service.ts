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
            const tz = 'Europe/Moscow';
            
            const params: any[] = [];
            let conditionsStr = '';
            let userProjStr = '';
            
            if (period !== 'all') {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - parseInt(period, 10));
                params.push(cutoffDate);
                conditionsStr += ` AND "createdAt" >= $${params.length}`;
            }

            if (!ctx.isGlobalAdmin && ctx.allowedProjects.length > 0) {
                const placeholders = ctx.allowedProjects.map(id => {
                    params.push(id);
                    return `$${params.length}`;
                }).join(', ');
                
                conditionsStr += ` AND "projectId" IN (${placeholders})`;
                userProjStr = ` AND "userId" IN (SELECT id FROM "User" WHERE "projectId" IN (${placeholders}))`;
            }

            const [ordersRaw, usersRaw, ticketsRaw, revenueRaw] = await Promise.all([
                prisma.$queryRawUnsafe<{dateStr: string, count: number}[]>(`
                    SELECT TO_CHAR("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE '${tz}', 'YYYY-MM-DD') as "dateStr",
                           COUNT(*)::int as count
                    FROM "Order"
                    WHERE 1=1 ${conditionsStr}
                    GROUP BY 1
                `, ...params),
                prisma.$queryRawUnsafe<{dateStr: string, count: number}[]>(`
                    SELECT TO_CHAR("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE '${tz}', 'YYYY-MM-DD') as "dateStr",
                           COUNT(*)::int as count
                    FROM "User"
                    WHERE 1=1 ${conditionsStr}  -- Users also have projectId in the schema
                    GROUP BY 1
                `, ...params),
                prisma.$queryRawUnsafe<{dateStr: string, count: number}[]>(`
                    SELECT TO_CHAR("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE '${tz}', 'YYYY-MM-DD') as "dateStr",
                           COUNT(*)::int as count
                    FROM "SupportTicket"
                    WHERE 1=1 ${conditionsStr}
                    GROUP BY 1
                `, ...params),
                prisma.$queryRawUnsafe<{dateStr: string, total: number}[]>(`
                    SELECT TO_CHAR("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE '${tz}', 'YYYY-MM-DD') as "dateStr",
                           COALESCE(SUM(amount), 0)::float as total
                    FROM "Transaction"
                    WHERE "status" = 'COMPLETED' AND "type" = 'DEPOSIT'
                    ${conditionsStr.replace(/AND "projectId" IN \([^)]+\)/, '')} ${userProjStr}
                    GROUP BY 1
                `, ...params)
            ]);

            // Merge data by date
            const dateMap = new Map<string, DailyChartData>();

            // Fill in missing days
            if (period !== 'all') {
                const numDays = parseInt(period, 10);
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(endDate.getDate() - numDays + 1);
                
                const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });

                for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                    const dStr = formatter.format(d);
                    dateMap.set(dStr, { date: dStr, orders: 0, users: 0, tickets: 0, revenue: 0 });
                }
            }

            const ensureSafeDateMap = (dateStr: string) => {
                if (!dateMap.has(dateStr)) {
                    dateMap.set(dateStr, { date: dateStr, orders: 0, users: 0, tickets: 0, revenue: 0 });
                }
            };

            for (const { dateStr, count } of ordersRaw) {
                if (!dateStr) continue;
                ensureSafeDateMap(dateStr);
                dateMap.get(dateStr)!.orders += count;
            }
            
            for (const { dateStr, count } of usersRaw) {
                if (!dateStr) continue;
                ensureSafeDateMap(dateStr);
                dateMap.get(dateStr)!.users += count;
            }
            
            for (const { dateStr, count } of ticketsRaw) {
                if (!dateStr) continue;
                ensureSafeDateMap(dateStr);
                dateMap.get(dateStr)!.tickets += count;
            }
            
            for (const { dateStr, total } of revenueRaw) {
                if (!dateStr) continue;
                ensureSafeDateMap(dateStr);
                dateMap.get(dateStr)!.revenue += total;
            }

            // Convert to array and sort ascending
            const result = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

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
