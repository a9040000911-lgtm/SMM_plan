/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from "@/lib/prisma";
import { AdminContext, AdminServiceResult } from "../../types";

export class AdminFinanceService {
    /**
     * Gets business expenses with optional project filtering.
     */
    static async getExpensesData(ctx: AdminContext): Promise<AdminServiceResult<{
        expenses: any[];
        allProjects: any[];
    }>> {
        try {
            const where: any = {};
            if (!ctx.isGlobalAdmin) {
                where.projectId = { in: ctx.allowedProjects };
            }

            const [expenses, allProjects] = await Promise.all([
                prisma.businessExpense.findMany({
                    where,
                    orderBy: { date: 'desc' },
                    take: 50,
                }),
                prisma.project.findMany({
                    where: ctx.isGlobalAdmin ? {} : { id: { in: ctx.allowedProjects } },
                    select: { id: true, name: true, createdAt: true, updatedAt: true }
                })
            ]);

            return {
                success: true,
                data: {
                    expenses: expenses.map(e => ({
                        ...e,
                        amount: e.amount.toNumber(),
                        date: e.date.toISOString(),
                        createdAt: e.createdAt.toISOString(),
                        updatedAt: e.updatedAt.toISOString(),
                    })),
                    allProjects: allProjects.map(p => ({
                        ...p,
                        createdAt: p.createdAt.toISOString(),
                        updatedAt: p.updatedAt.toISOString(),
                    }))
                }
            };
        } catch (error: any) {
            return {
                success: false,
                error: { code: 'ADMIN_EXPENSES_FETCH_FAILED', message: error.message }
            };
        }
    }

    /**
     * Gets global treasury data (Assets vs Liabilities). Only for Global Admins.
     */
    static async getTreasuryData(ctx: AdminContext): Promise<AdminServiceResult<{
        totalUserBalanceRUB: number;
        providersAssetsRUB: number;
        providerDetails: any[];
        currencyRates: any;
        dailyRevenue: number;
        dailyCost: number;
        failoverLeakage: number;
    }>> {
        if (!ctx.isGlobalAdmin) {
             return { success: false, error: { code: 'UNAUTHORIZED_TREASURY', message: 'Ограниченный доступ. Только для глобальных администраторов.' } };
        }

        try {
            // Get currency exchange rates
            const ratesRaw = await prisma.currencyRate.findMany();
            const rates: Record<string, number> = {};
            ratesRaw.forEach(r => { rates[r.code] = r.rate.toNumber(); });
            rates['RUB'] = 1; // Base currency fallback

            // 1. Calculate Liabilities (Users Balance)
            const usersAggregation = await prisma.user.aggregate({
                _sum: { balance: true }
            });
            const totalUserBalanceRUB = usersAggregation._sum.balance?.toNumber() || 0;

            // 2. Calculate Assets (Providers Balance)
            const providers = await prisma.provider.findMany({
                where: { isEnabled: true },
                select: {
                    id: true,
                    name: true,
                    balanceCurrency: true,
                    balanceLogs: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: { balance: true, createdAt: true }
                    }
                }
            });

            let providersAssetsRUB = 0;
            const providerDetails = providers.map(p => {
                const latestBalance = p.balanceLogs[0]?.balance?.toNumber() || 0;
                const convertedRUB = latestBalance * (rates[p.balanceCurrency] || 1);
                providersAssetsRUB += convertedRUB;

                return {
                    id: p.id,
                    name: p.name,
                    currency: p.balanceCurrency,
                    latestBalance,
                    convertedRUB,
                    lastCheckedAt: p.balanceLogs[0]?.createdAt?.toISOString() || null
                };
            });

            // 3. 24h Revenue and Costs
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const [dailyRevenueAgg, orders24h] = await Promise.all([
                prisma.transaction.aggregate({
                    where: { type: 'DEPOSIT', status: 'COMPLETED', createdAt: { gte: yesterday } },
                    _sum: { amount: true }
                }),
                prisma.order.findMany({
                    where: { createdAt: { gte: yesterday } },
                    select: { status: true, costPrice: true, metadata: true }
                })
            ]);

            const dailyRevenue = dailyRevenueAgg._sum.amount?.toNumber() || 0;
            
            let dailyCost = 0;
            let failoverLeakage = 0;

            for (const o of orders24h) {
                // Текущая стоимость активного провайдера
                if (o.status !== 'CANCELED' && o.costPrice) {
                    dailyCost += o.costPrice.toNumber();
                }

                // Анализируем исторические затраты (Failover попытки)
                const meta = o.metadata as Record<string, any>;
                if (meta && Array.isArray(meta.providerHistory)) {
                    for (const attempt of meta.providerHistory) {
                        // Если статус отменен - деньги возвращаются на наш баланс у провайдера
                        // Если PARTIAL, PROCESSING, PENDING - деньги могли уйти безвозвратно
                        if (attempt.status !== 'CANCELED' && attempt.status !== 'REFUNDED') {
                            const pastCost = attempt.costPrice ? Number(attempt.costPrice) : 0;
                            if (!isNaN(pastCost) && pastCost > 0) {
                                dailyCost += pastCost;
                                failoverLeakage += pastCost;
                            }
                        }
                    }
                }
            }

            return {
                success: true,
                data: {
                    totalUserBalanceRUB,
                    providersAssetsRUB,
                    providerDetails,
                    currencyRates: rates,
                    dailyRevenue,
                    dailyCost,
                    failoverLeakage
                }
            };

        } catch (error: any) {
            return {
                success: false,
                error: { code: 'TREASURY_FETCH_FAILED', message: error.message }
            };
        }
    }
}
