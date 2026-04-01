/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { Prisma, User } from '@prisma/client';
import { Decimal } from 'decimal.js';

export class UserRepository {
    /**
     * Finds a user by ID.
     */
    static async findById(id: string, tx?: Prisma.TransactionClient): Promise<User | null> {
        const db = tx || prisma;
        return await db.user.findUnique({ where: { id } });
    }

    /**
     * Finds a user by email within a specific project.
     */
    static async findByEmail(email: string, projectId: string | null, tx?: Prisma.TransactionClient): Promise<User | null> {
        const db = tx || prisma;
        return await db.user.findFirst({
            where: { email: email.toLowerCase(), projectId }
        });
    }

    /**
     * Finds a user by Telegram ID.
     */
    static async findByTgId(tgId: bigint, tx?: Prisma.TransactionClient): Promise<User | null> {
        const db = tx || prisma;
        return await db.user.findUnique({ where: { tgId } });
    }

    /**
     * Updates user balance and spent amount atomically.
     * Returns true if update was successful (e.g. balance was sufficient).
     */
    static async updateBalance(
        userId: string, 
        amountDelta: Decimal, 
        spentDelta: Decimal, 
        tx?: Prisma.TransactionClient
    ): Promise<boolean> {
        const db = tx || prisma;
        
        // Use updateMany for atomic check if amountDelta is negative (withdrawal)
        if (amountDelta.isNegative()) {
            const absDelta = amountDelta.abs();
            const result = await db.user.updateMany({
                where: {
                    id: userId,
                    balance: { gte: absDelta }
                },
                data: {
                    balance: { decrement: absDelta },
                    spent: { increment: spentDelta }
                }
            });
            return result.count > 0;
        }

        // Positive delta (deposit) or zero
        await db.user.update({
            where: { id: userId },
            data: {
                balance: { increment: amountDelta },
                spent: { increment: spentDelta }
            }
        });
        return true;
    }

    /**
     * Updates specific user fields.
     */
    static async update(userId: string, data: Prisma.UserUpdateInput, tx?: Prisma.TransactionClient): Promise<User> {
        const db = tx || prisma;
        return await db.user.update({
            where: { id: userId },
            data
        });
    }

    /**
     * Gets a user with project-specific settings.
     */
    static async getUserWithProject(userId: string, tx?: Prisma.TransactionClient) {
        const db = tx || prisma;
        return await db.user.findUnique({
            where: { id: userId },
            include: { project: { select: { botUsername: true } } }
        });
    }
}
