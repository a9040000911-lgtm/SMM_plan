/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { Decimal } from 'decimal.js';
import { Prisma, OrgLedgerType, Currency } from '@prisma/client';

export class OrganizationLedgerService {

    /**
     * Создает транзакцию списания или пополнения Master Balance организации (B2B Billing)
     * Использует Prisma.TransactionClient для атомарности.
     */
    static async recordTransaction(
        tx: Prisma.TransactionClient,
        params: {
            organizationId: string;
            amount: Decimal | number;
            type: OrgLedgerType;
            referenceId?: string;
            description?: string;
            currency?: Currency;
        }
    ) {
        const organization = await tx.organization.findUnique({
            where: { id: params.organizationId }
        });

        if (!organization) {
            throw new Error(`Organization ${params.organizationId} not found`);
        }

        const balanceBefore = organization.masterBalance;
        let balanceAfter: Decimal;
        const amount = new Decimal(params.amount);

        // АТОМАРНОЕ Обновление баланса организации
        let updateData: any = {};
        if (params.type === 'TOPUP' || params.type === 'REFUND') {
            updateData = { masterBalance: { increment: amount } };
        } else if (params.type === 'SERVICE_COST') {
            updateData = { masterBalance: { decrement: amount } };
        } else if (params.type === 'ADJUSTMENT') {
            updateData = { masterBalance: { increment: amount } };
        }

        const updatedOrg = await tx.organization.updateMany({
            where: { 
                id: params.organizationId,
                ...(params.type === 'SERVICE_COST' ? { masterBalance: { gte: amount } } : {})
            },
            data: updateData
        });

        if (updatedOrg.count === 0) {
            if (params.type === 'SERVICE_COST') {
                throw new Error('B2B_INSUFFICIENT_FUNDS_ATOMIC_LOCK');
            } else {
                // В случае пополнения/возврата/отсутствия организации (что маловероятно)
                throw new Error(`Failed to update Organization Ledger for ${params.organizationId}`);
            }
        }

        // Fetch exact absolute balance for ledger consistency
        const orgRefresh = await tx.organization.findUnique({ where: { id: params.organizationId } });
        balanceAfter = orgRefresh?.masterBalance || new Decimal(0);

        // Создаем лог транзакции
        const entry = await tx.organizationLedgerEntry.create({
            data: {
                organizationId: params.organizationId,
                amount: amount.abs(), // В ledger всегда пишем по модулю
                currency: params.currency || 'RUB',
                balanceBefore: balanceBefore,
                balanceAfter: balanceAfter,
                type: params.type,
                referenceId: params.referenceId,
                description: params.description
            }
        });

        return {
            entry,
            newBalance: balanceAfter
        };
    }
}
