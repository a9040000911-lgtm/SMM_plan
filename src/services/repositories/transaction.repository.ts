/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { Prisma, Transaction, TransactionStatus } from '@/generated/client';
import { Decimal } from 'decimal.js';

export class TransactionRepository {
    /**
     * Creates a new transaction record.
     */
    static async create(
        data: {
            userId: string;
            amount: Decimal | number;
            type: Prisma.TransactionCreateInput['type'];
            provider: string;
            projectId?: string | null;
            externalId?: string | null;
            metadata?: any;
            orderId?: number | null;
            status: TransactionStatus,
        },
        tx?: Prisma.TransactionClient
    ): Promise<Transaction> {
        const db = tx || prisma;
        return await db.transaction.create({
            data: {
                userId: data.userId,
                amount: new Decimal(data.amount),
                type: data.type,
                provider: data.provider,
                projectId: data.projectId,
                externalId: data.externalId,
                metadata: data.metadata,
                orderId: data.orderId,
                status: data.status || 'PENDING'
            }
        });
    }

    /**
     * Updates transaction status.
     */
    static async updateStatus(
        transactionId: string,
        status: TransactionStatus,
        metadata?: any,
        tx?: Prisma.TransactionClient
    ): Promise<Transaction> {
        const db = tx || prisma;
        return await db.transaction.update({
            where: { id: transactionId },
            data: { 
                status,
                metadata: metadata ? { 
                    ...(metadata as object), 
                    updatedAt: new Date().toISOString() 
                } : undefined
            }
        });
    }

    /**
     * Finds a transaction by its external provider ID.
     */
    static async findByExternalId(externalId: string, tx?: Prisma.TransactionClient): Promise<Transaction | null> {
        const db = tx || prisma;
        return await db.transaction.findUnique({
            where: { externalId }
        });
    }

    /**
     * Finds most recent transactions for a user.
     */
    static async findRecentByUser(userId: string, limit = 10): Promise<Transaction[]> {
        return await prisma.transaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }
}
