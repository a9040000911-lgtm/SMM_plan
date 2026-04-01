'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { AdminServices } from '@/services/admin/registry';
import { revalidatePath } from 'next/cache';
import { getAdminContext } from '@/utils/admin-context';

export async function updateGlobalSettingsAction(settings: Record<string, string>) {
    try {
        const ctx = await getAdminContext();
        if (!ctx.isGlobalAdmin) {
            throw new Error('Unauthorized: Global Admin access required');
        }

        // Encrypt sensitive keys if they are present and NOT already encrypted
        const sensitiveKeys = [
            'GLOBAL_YOOKASSA_SHOP_ID', 
            'GLOBAL_YOOKASSA_SECRET_KEY',
            'GLOBAL_ROBOKASSA_MERCHANT_LOGIN',
            'GLOBAL_PAYMENT_MODE',
            'GLOBAL_ROBOKASSA_PASSWORD1',
            'GLOBAL_ROBOKASSA_PASSWORD2'
        ];

        const { CryptoService } = await import('@/services/core/crypto.service');
        const processedSettings = { ...settings };
        
        for (const key of sensitiveKeys) {
            if (processedSettings[key] && !processedSettings[key].includes(':')) {
                processedSettings[key] = CryptoService.encrypt(processedSettings[key]);
            }
        }

        const res = await AdminServices.management.updateGlobalSettings(ctx, { settings: processedSettings });
        if (!res.success) throw new Error(res.error?.message);

        revalidatePath('/admin/settings');
        return { success: true };
    } catch (e: any) {
        console.error('[GlobalSettings] Error updating settings:', e);
        return { success: false, error: e.message };
    }
}

export async function getGlobalSettingsAction() {
    try {
        const ctx = await getAdminContext();
        const res = await AdminServices.management.getGlobalSettings(ctx);
        if (!res.success) throw new Error(res.error?.message);
        return { success: true, settings: res.data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function topUpB2BBalanceAction(amount: number, organizationId: string) {
    try {
        const ctx = await getAdminContext();
        if (!ctx.allowedProjects || ctx.allowedProjects.length === 0) {
            throw new Error('Unauthorized');
        }

        const { PaymentService } = await import('@/services/finance/payment.service');
        // Return back to the settings page
        const returnUrl = `${process.env.APP_URL || 'http://localhost:3000'}/admin/settings`;

        const payment = await PaymentService.createB2BPayment(amount, organizationId, returnUrl);

        if (!payment.success || !payment.confirmationUrl) {
            throw new Error(payment.error || 'Ошибка при создании B2B платежа');
        }

        return { success: true, confirmationUrl: payment.confirmationUrl };
    } catch (e: any) {
        console.error('[B2B Topup Action] Error:', e);
        return { success: false, error: e.message };
    }
}
