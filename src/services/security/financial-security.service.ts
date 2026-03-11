/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';

export interface ProviderSlippageReport {
    providerId: string;
    providerName: string;
    period: { start: Date; end: Date };
    startBalance: number;
    endBalance: number;
    totalTopUps: number;
    actualSpend: number;
    expectedSpend: number;
    slippage: number; // Difference between actual and expected
    slippagePercent: number;
    status: 'OK' | 'WARNING' | 'CRITICAL';
    currency: string;
}

export class FinancialSecurityService {
    /**
     * Calculates the "Slippage" - the difference between actual provider balance decrease
     * and the theoretical cost of orders sent to that provider.
     */
    static async getProviderSlippage(providerId: string, daysIdx: number = 30): Promise<ProviderSlippageReport> {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - daysIdx);

        // 1. Get Provider Info
        const provider = await prisma.provider.findUnique({
            where: { id: providerId },
            include: { payments: { where: { createdAt: { gte: startDate } } } }
        });

        if (!provider) throw new Error(`Provider ${providerId} not found`);

        // Explicitly cast to ensure TS knows about payments if inference fails
        const providerWithPayments = provider as any;


        // 2. Get Balance Logs for period
        const firstLog = await prisma.providerBalanceLog.findFirst({
            where: { providerId, createdAt: { gte: startDate } },
            orderBy: { createdAt: 'asc' }
        });

        const lastLog = await prisma.providerBalanceLog.findFirst({
            where: { providerId },
            orderBy: { createdAt: 'desc' }
        });

        const startBalance = firstLog?.balance.toNumber() || 0;
        const endBalance = lastLog?.balance.toNumber() || 0;

        // 3. Calculate Actual Spend
        // Spend = Start - End + TopUps
        const totalTopUps = providerWithPayments.payments
            .filter((p: any) => p.type === 'TOPUP')
            .reduce((acc: number, p: any) => acc + Number(p.amount), 0);

        const totalRefunds = providerWithPayments.payments
            .filter((p: any) => p.type === 'REFUND')
            .reduce((acc: number, p: any) => acc + Number(p.amount), 0);

        // Adjust for manual corrections
        const totalAdjustments = providerWithPayments.payments
            .filter((p: any) => p.type === 'ADJUSTMENT')
            .reduce((acc: number, p: any) => acc + Number(p.amount), 0);


        // If no logs, we can't calculate actual spend reliably without start/end snapshots.
        // Assuming Best Effort:
        let actualSpend = 0;
        if (firstLog && lastLog) {
            actualSpend = (startBalance - endBalance) + totalTopUps - totalRefunds + totalAdjustments;
        }

        // 4. Calculate Expected Spend (Orders Cost)
        const orders = await prisma.order.findMany({
            where: {
                providerName: provider.name,
                createdAt: { gte: startDate, lte: endDate },
                status: { not: 'CANCELED' }, // Assuming canceled orders are refunded or not charged
                // Ideally we should track "Charged" status or provider specific status
            },
            select: { costPrice: true, quantity: true, refundedAmount: true } // Assuming we might store refundAmount if partial
        });

        // NOTE: This is an estimation. 
        // Accurate calculation requires tracking exact cost per order in provider's currency.
        // We assume costPrice is stored in the same currency as provider balance (or converted).
        const expectedSpend = orders.reduce((acc, o) => {
            const cost = o.costPrice?.toNumber() || 0;
            const refund = o.refundedAmount?.toNumber() || 0;
            return acc + cost - refund;
        }, 0);


        // 5. Analysis
        const slippage = actualSpend - expectedSpend;
        // Slippage > 0 means we spent MORE than expected (Bad)
        // Slippage < 0 means we spent LESS than expected (Good? or Sync/Refund issue)

        let slippagePercent = 0;
        if (expectedSpend > 0) {
            slippagePercent = (slippage / expectedSpend) * 100;
        } else if (actualSpend > 0) {
            slippagePercent = 100; // Spent money but 0 orders? Critical.
        }

        let status: 'OK' | 'WARNING' | 'CRITICAL' = 'OK';
        const meta = provider.metadata as any;
        const currency = meta?.balanceCurrency || meta?.currency || 'RUB';

        // Thresholds (e.g. 5% discrepancy or > $10 absolute)
        if (slippagePercent > 5 || (slippage > 1000 && currency === 'RUB') || (slippage > 10 && currency === 'USD')) {
            status = 'WARNING';
        }
        if (slippagePercent > 20 || (slippage > 5000 && currency === 'RUB') || (slippage > 50 && currency === 'USD')) {
            status = 'CRITICAL';
        }

        return {
            providerId,
            providerName: provider.name,
            period: { start: startDate, end: endDate },
            startBalance,
            endBalance,
            totalTopUps,
            actualSpend,
            expectedSpend,
            slippage,
            slippagePercent,
            status,
            currency
        };
    }

    // === USER SECURITY & LTV MONITOR ===

    static async getSecurityRisks() {
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { balance: { gt: 100 } },
                    { role: { in: ['ADMIN', 'SUPPORT'] } }
                ]
            },
            include: {
                transactions: true
            }
        });

        const risks = [];

        for (const user of users) {
            const analysis = this.analyzeUserLTV(user, user.transactions);
            if (analysis.riskScore > 0) {
                risks.push(analysis);
            }
        }

        return risks.sort((a, b) => b.riskScore - a.riskScore);
    }

    static analyzeUserLTV(user: any, transactions: any[]) {
        let totalDeposited = new Decimal(0);
        let totalBonuses = new Decimal(0);
        let totalSpent = new Decimal(0);
        let totalRefunded = new Decimal(0); // Refunds return money to balance
        let manualAdjustments = new Decimal(0); // +/-

        for (const tx of transactions) {
            const amount = new Decimal(tx.amount);

            if (tx.status !== 'COMPLETED') continue;

            // Mapping based on TransactionType enum guess
            switch (tx.type) {
                case 'DEPOSIT':
                    totalDeposited = totalDeposited.plus(amount);
                    break;
                case 'WITHDRAWAL':
                case 'ORDER_PAYMENT':
                case 'NEW_ORDER':
                case 'ORDER_STATUS_CHANGE':
                    totalSpent = totalSpent.plus(amount);
                    break;
                case 'BONUS':
                case 'REFERRAL_BONUS':
                case 'LOYALTY_BONUS':
                    totalBonuses = totalBonuses.plus(amount);
                    break;
                case 'REFUND':
                    totalRefunded = totalRefunded.plus(amount);
                    break;
                case 'MANUAL_ADJUSTMENT':
                case 'ADJUSTMENT':
                    manualAdjustments = manualAdjustments.plus(amount);
                    break;
            }
        }

        // Expected Balance Formula:
        // (Deposited + Bonuses + Manual + Refunded) - Spent = Expected Balance
        const inflow = totalDeposited.plus(totalBonuses).plus(totalRefunded).plus(manualAdjustments);
        const expectedBalance = inflow.minus(totalSpent);

        const currentBalance = new Decimal(user.balance);

        // Gap = Actual - Expected. 
        const gap = currentBalance.minus(expectedBalance);

        let riskScore = 0;
        let riskLabel = 'OK';

        // Threshold 100 RUB
        if (gap.greaterThan(100)) {
            riskScore = gap.toNumber();
            riskLabel = gap.greaterThan(10000) ? 'CRITICAL' : 'WARNING';
        }

        return {
            userId: user.id,
            username: user.username,
            email: user.email,
            currentBalance: currentBalance.toNumber(),
            expectedBalance: expectedBalance.toNumber(),
            gap: gap.toNumber(),
            totalDeposited: totalDeposited.toNumber(),
            totalSpent: totalSpent.toNumber(),
            totalBonuses: totalBonuses.toNumber(),
            riskScore,
            riskLabel
        };
    }
}
