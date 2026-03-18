'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { MassOrderService } from '@/services/orders/mass-order.service';
import { auth } from "@/auth";

import { getClientProjectId } from '@/utils/project-resolver';

export async function previewMassOrder(text: string) {
    try {
        const session = await auth();
        const userId = (session?.user as any)?.id;
        if (!userId) throw new Error('Не авторизован');

        const projectId = await getClientProjectId();

        const entries = MassOrderService.parseText(text);
        if (entries.length === 0) throw new Error('Не найдено корректных строк с заказами. Формат: ID_Услуги | Ссылка | Количество');

        const preview = await MassOrderService.validateMassOrder(userId, projectId, entries);

        return {
            success: true,
            data: {
                totalAmount: preview.totalBatchAmount.toNumber(),
                hasSufficientBalance: preview.hasSufficientBalance,
                balance: preview.user.balance.toNumber(),
                entries: preview.validatedEntries.map(e => ({
                    ...e,
                    price: e.price.toNumber()
                }))
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function executeMassOrder(text: string) {
    try {
        const session = await auth();
        const userId = (session?.user as any)?.id;
        if (!userId) throw new Error('Не авторизован');

        const projectId = await getClientProjectId();

        const entries = MassOrderService.parseText(text);
        if (entries.length === 0) throw new Error('Не найдено корректных строк с заказами.');

        const result = await MassOrderService.processMassOrder(userId, projectId, entries);

        return {
            success: true,
            data: {
                batchId: result.batchId,
                orderCount: result.orderCount,
                totalAmount: result.totalAmount.toNumber()
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


