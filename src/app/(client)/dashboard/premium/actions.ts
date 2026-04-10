"use server";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { CatalogService } from "@/services/core/catalog.service";

export async function analyzePremiumLink(link: string) {
    const result = await CatalogService.analyzePremiumLink(link);
    if (!result.success) return { error: result.error.message };
    return result.data;
}

export async function getPremiumServices(platform?: string) {
    const result = await CatalogService.getPremiumServices(platform);
    if (!result.success) return [];
    return result.data;
}

import { auth } from '@/auth';
import { SubscriptionService } from '@/services/finance/subscription.service';
import { revalidatePath } from 'next/cache';

export async function toggleSubscriptionAutoRenew(action: 'cancel' | 'resume') {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error('Unauthorized');

        if (action === 'cancel') {
            await SubscriptionService.cancelSubscription(session.user.id);
        } else {
            await SubscriptionService.resumeSubscription(session.user.id);
        }

        revalidatePath('/dashboard/premium');
        return { success: true };
    } catch (error: any) {
        console.error('[toggleSubscriptionAutoRenew]', error);
        return { success: false, error: error.message };
    }
}


