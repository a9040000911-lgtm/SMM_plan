/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
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
            // Construct Prisma.sql fragments
            const whereProject = !ctx.isGlobalAdmin && ctx.allowedProjects.length > 0
                ? Prisma.sql`AND "projectId" IN (${Prisma.join(ctx.allowedProjects)})`
                : Prisma.empty;

            // Notice that User table uses "projectId" too (although some global users might be null, but we'll stick to project scope if not global)
            const whereProjectUser = !ctx.isGlobalAdmin && ctx.allowedProjects.length > 0
                ? Prisma.sql`AND "projectId" IN (${Prisma.join(ctx.allowedProjects)})`
                : Prisma.empty;
            
            // Transaction has relation to user, so we have to join or ignore project if we want exact revenue per project.
            // For revenue, it's safer to query using Prisma ORM with select or a simple Prisma groupBy equivalent in JS, 
            // OR we can do a raw query joining User table. Let's do it safely without complex joins for Transaction if possible.
            // Wait, Transaction doesn't have projectId. It has "userId".
            const whereUserInProj = !ctx.isGlobalAdmin && ctx.allowedProjects.length > 0
                ? Prisma.sql`AND "userId" IN (SELECT id FROM "User" WHERE "projectId" IN (${Prisma.join(ctx.allowedProjects)}))`
                : Prisma.empty;

            const timeClause = period !== 'all' 
                ? Prisma.sql`AND "createdAt" >= NOW() - CAST(${period + ' days'} AS INTERVAL)`
                : Prisma.empty;

            const [ordersRaw, usersRaw, ticketsRaw, revenueRaw] = await Promise.all([
                prisma.$queryRaw<any[]>`
                    SELECT DATE("createdAt") as date, COUNT(*)::int as value
                    FROM "Order"
                    WHERE 1=1 ${whereProject} ${timeClause}
                    GROUP BY DATE("createdAt")
                    ORDER BY date ASC
                `,
                prisma.$queryRaw<any[]>`
                    SELECT DATE("createdAt") as date, COUNT(*)::int as value
                    FROM "User"
                    WHERE 1=1 ${whereProjectUser} ${timeClause}
                    GROUP BY DATE("createdAt")
                    ORDER BY date ASC
                `,
                prisma.$queryRaw<any[]>`
                    SELECT DATE("createdAt") as date, COUNT(*)::int as value
                    FROM "SupportTicket"
                    WHERE 1=1 ${whereProject} ${timeClause}
                    GROUP BY DATE("createdAt")
                    ORDER BY date ASC
                `,
                prisma.$queryRaw<any[]>`
                    SELECT DATE("createdAt") as date, SUM("amount") as value
                    FROM "Transaction"
                    WHERE "status" = 'COMPLETED' AND "type" = 'DEPOSIT' ${whereUserInProj} ${timeClause}
                    GROUP BY DATE("createdAt")
                    ORDER BY date ASC
                `
            ]);

            // Merge data by date
            const dateMap = new Map<string, DailyChartData>();

            const addData = (rawSet: any[], key: keyof Omit<DailyChartData, 'date'>) => {
                for (const row of rawSet) {
                    if (!row.date) continue;
                    // Format PG date object to string 'YYYY-MM-DD'
                    const dateStr = typeof row.date === 'string' ? row.date : row.date.toISOString().split('T')[0];
                    if (!dateMap.has(dateStr)) {
                        dateMap.set(dateStr, { date: dateStr, orders: 0, users: 0, tickets: 0, revenue: 0 });
                    }
                    const entry = dateMap.get(dateStr)! as any;
                    entry[key] = Number(row.value) || 0;
                }
            };

            addData(ordersRaw, 'orders');
            addData(usersRaw, 'users');
            addData(ticketsRaw, 'tickets');
            addData(revenueRaw, 'revenue');

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
