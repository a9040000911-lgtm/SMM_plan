'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/utils/admin-session';

export interface AdminFinanceMetrics {
    totalBalance: number;
    totalDeposits: number;
    totalExpenses: number;
    netProfit: number;
    period: 'all' | 'month' | 'today';
}

export async function getFinanceMetricsAction(period: 'all' | 'month' | 'today' = 'all'): Promise<AdminFinanceMetrics> {
    const session = await getAdminSession();
    if (!session || !['ADMIN', 'SUPPORT'].includes(session.role)) {
        throw new Error('Unauthorized');
    }

    let dateFilter: any = {};
    const now = new Date();

    if (period === 'today') {
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        dateFilter = { gte: startOfDay };
    } else if (period === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { gte: startOfMonth };
    }

    // 1. Total User Balance (Liability) - Always current snapshot
    // Считаем сумму балансов всех пользователей. Это деньги, которые они могут потратить.
    // Это "Свободные средства" клиентов, но для нас это Обязательство.
    // Однако в контексте админки часто хотят видеть "Сколько денег лежит на счетах".
    const userBalances = await prisma.user.aggregate({
        _sum: { balance: true }
    });

    // 2. Total Income (Completed Deposits)
    const income = await prisma.transaction.aggregate({
        where: {
            type: 'DEPOSIT',
            status: 'COMPLETED',
            ...(period !== 'all' ? { createdAt: dateFilter } : {})
        },
        _sum: { amount: true }
    });

    // 3. Cost of Goods Sold (COGS) - Provider Costs
    // Себестоимость выполненных/частично выполненных заказов
    const cogs = await prisma.order.aggregate({
        where: {
            status: { not: 'CANCELED' },
            costPrice: { not: null },
            ...(period !== 'all' ? { createdAt: dateFilter } : {})
        },
        _sum: { costPrice: true }
    });

    // 4. Operating Expenses (Business Expenses)
    const opEx = await prisma.businessExpense.aggregate({
        where: {
            ...(period !== 'all' ? { date: dateFilter } : {})
        },
        _sum: { amount: true }
    });

    // Calculations
    const totalBalance = Number(userBalances._sum.balance || 0);
    const totalDeposits = Number(income._sum.amount || 0);
    const totalCOGS = Number(cogs._sum.costPrice || 0);
    const totalOpEx = Number(opEx._sum.amount || 0);
    const totalExpenses = totalCOGS + totalOpEx;
    const netProfit = totalDeposits - totalExpenses;

    return {
        totalBalance,
        totalDeposits,
        totalExpenses,
        netProfit,
        period
    };
}
