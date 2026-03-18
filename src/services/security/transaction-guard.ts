/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';

export class TransactionGuard {
    /**
     * Verifies that a transaction exists, belongs to the correct user, 
     * and has the expected amount and project.
     */
    static async verify(txId: string, userId: string, expectedAmount: number | Decimal, projectId?: string | null) {
        const transaction = await prisma.transaction.findFirst({
            where: {
                OR: [
                    { id: String(txId) },
                    { externalId: String(txId) }
                ],
                userId,
                status: 'COMPLETED'
            }
        });

        if (!transaction) {
            return { valid: false, reason: 'Transaction not found or not completed' };
        }

        const actualAmount = new Decimal(transaction.amount);
        const expectedAmt = new Decimal(expectedAmount);

        if (!actualAmount.equals(expectedAmt)) {
            return { valid: false, reason: `Amount mismatch: expected ${expectedAmt}, got ${actualAmount}` };
        }

        if (projectId && transaction.projectId !== projectId) {
            return { valid: false, reason: 'Project ID mismatch' };
        }

        return { valid: true, transaction };
    }
}


