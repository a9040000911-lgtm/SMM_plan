/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';
import { LedgerService } from '@/services/finance';
import { PromoService } from '@/services/users';

export interface MassOrderEntry {
    serviceId: string;
    link: string;
    quantity: number;
}

export class MassOrderService {
    /**
     * Parses a text block with multiple orders
     * Format: service_id | link | quantity (one per line)
     */
    static parseText(text: string): MassOrderEntry[] {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const entries: MassOrderEntry[] = [];

        for (const line of lines) {
            // Support common separators: |, ,, ;, \t
            const parts = line.split(/[|,;\t]/).map(p => p.trim());
            if (parts.length >= 3) {
                const [sid, link, qtyStr] = parts;
                const qty = parseInt(qtyStr);
                if (sid && link && !isNaN(qty)) {
                    entries.push({ serviceId: sid, link, quantity: qty });
                }
            }
        }
        return entries;
    }

    /**
   * Validates a mass order and returns a summary for preview
   */
    static async validateMassOrder(userId: string, projectId: string | null, entries: MassOrderEntry[]) {
        if (entries.length === 0) throw new Error('No valid order entries found');

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found');

        const serviceIds = [...new Set(entries.map(e => e.serviceId))];

        // Flexible lookup: by string id or by numericId
        const numericIds = serviceIds.map(id => parseInt(id)).filter(id => !isNaN(id));

        const services = await prisma.internalService.findMany({
            where: {
                OR: [
                    { id: { in: serviceIds } },
                    { numericId: { in: numericIds } }
                ],
                isActive: true
            }
        });

        // Create a map that supports both ID types for quick lookup
        const svcMap = new Map<string, any>();
        services.forEach(s => {
            svcMap.set(s.id, s);
            svcMap.set(s.numericId.toString(), s);
        });

        const validatedEntries: (MassOrderEntry & { price: Decimal; serviceName: string; costPrice: Decimal | null; realServiceId: string })[] = [];
        let totalBatchAmount = new Decimal(0);

        for (const entry of entries) {
            const svc = svcMap.get(entry.serviceId);
            if (!svc) continue;

            if (entry.quantity < svc.minQty || entry.quantity > svc.maxQty) continue;

            const price = svc.pricePer1000.mul(entry.quantity).div(1000).toDecimalPlaces(2, Decimal.ROUND_CEIL);
            totalBatchAmount = totalBatchAmount.plus(price);
            validatedEntries.push({
                ...entry,
                price,
                serviceName: svc.name,
                costPrice: svc.lastProviderPrice,
                realServiceId: svc.id
            });
        }

        if (validatedEntries.length === 0) throw new Error('No services could be matched or quantity requirements not met');

        return {
            user,
            totalBatchAmount,
            validatedEntries,
            hasSufficientBalance: user.balance.gte(totalBatchAmount)
        };
    }

    /**
     * Processes a list of mass order entries (Execution)
     */
    static async processMassOrder(userId: string, projectId: string | null, entries: MassOrderEntry[]) {
        const { user, totalBatchAmount, validatedEntries, hasSufficientBalance } = await this.validateMassOrder(userId, projectId, entries);

        if (!hasSufficientBalance) {
            throw new Error(`Insufficient balance. Required: ${totalBatchAmount} RUB, available: ${user.balance} RUB.`);
        }

        return await prisma.$transaction(async (tx) => {
            const batch = await tx.batchOrder.create({
                data: {
                    userId,
                    projectId,
                    totalAmount: totalBatchAmount,
                    orderCount: validatedEntries.length,
                    status: 'COMPLETED'
                }
            });

            for (const entry of validatedEntries) {
                const order = await tx.order.create({
                    data: {
                        userId,
                        projectId,
                        batchOrderId: batch.id,
                        internalServiceId: entry.realServiceId,
                        link: entry.link,
                        quantity: entry.quantity,
                        totalPrice: entry.price,
                        costPrice: entry.costPrice,
                        status: 'PENDING'
                    }
                });

                await tx.transaction.create({
                    data: {
                        projectId,
                        userId,
                        orderId: order.id,
                        amount: entry.price,
                        type: 'ORDER_PAYMENT',
                        provider: 'INTERNAL',
                        status: 'COMPLETED'
                    }
                });

                await tx.transaction.create({
                    data: {
                        projectId,
                        userId,
                        orderId: order.id,
                        amount: entry.price,
                        type: 'NEW_ORDER',
                        provider: 'INTERNAL',
                        status: 'COMPLETED'
                    }
                });

                await LedgerService.record(tx, userId, entry.price, 'WITHDRAWAL', order.id.toString(), `Bulk Order: ${entry.serviceName}`);
            }

            await tx.user.update({
                where: { id: userId },
                data: {
                    balance: { decrement: totalBatchAmount },
                    spent: { increment: totalBatchAmount }
                }
            });

            // Loyalty Check
            const updatedUser = await tx.user.findUnique({ where: { id: userId }, select: { spent: true } });
            if (updatedUser) {
                await PromoService.checkLoyaltySpend(userId, Number(user.tgId), updatedUser.spent.toNumber());
            }

            return {
                batchId: batch.id,
                orderCount: validatedEntries.length,
                totalAmount: totalBatchAmount
            };
        });
    }
}


