/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Decimal } from 'decimal.js';

export class OrderRepository {
    /**
     * Finds an order with basic relations
     */
    static async findById(id: number, tx?: Prisma.TransactionClient) {
        const db = tx || prisma;
        return db.order.findUnique({
            where: { id },
            include: {
                user: true,
                internalService: true
            }
        });
    }

    /**
     * Updates order status and other fields
     */
    static async update(id: number, data: Prisma.OrderUpdateInput, tx?: Prisma.TransactionClient) {
        const db = tx || prisma;
        return db.order.update({
            where: { id },
            data,
            include: {
                user: true,
                internalService: true
            }
        });
    }

    /**
     * Creates a new order record
     */
    static async create(data: Prisma.OrderUncheckedCreateInput, tx?: Prisma.TransactionClient) {
        const db = tx || prisma;
        return db.order.create({
            data: data as any, // Cast to any to bypass strict CreateInput vs UncheckedCreateInput mismatch in .create()
            include: {
                user: true,
                internalService: true
            }
        });
    }
    
    /**
     * Atomic update for multiple orders
     */
    static async updateMany(where: Prisma.OrderWhereInput, data: Prisma.OrderUpdateManyMutationInput, tx?: Prisma.TransactionClient) {
        const db = tx || prisma;
        return db.order.updateMany({ where, data });
    }

    /**
     * Specialized atomic update for refunds to prevent double-refunding.
     */
    static async atomicRefundUpdate(
        orderId: number,
        maxPrice: Decimal | number,
        data: Prisma.OrderUpdateManyMutationInput,
        tx?: Prisma.TransactionClient
    ): Promise<boolean> {
        const db = tx || prisma;
        const result = await db.order.updateMany({
            where: {
                id: orderId,
                refundedAmount: { lt: maxPrice }
            },
            data
        });
        return result.count > 0;
    }
}


