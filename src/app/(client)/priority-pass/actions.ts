'use server';

import { auth } from '@/auth';
import { SubscriptionService } from '@/services/finance/subscription.service';
import { PaymentResult } from '@/types/payment';

export async function upgradeToPriorityPass(returnUrl: string): Promise<PaymentResult> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Пожалуйста, авторизуйтесь.' };
    }

    try {
        const result = await SubscriptionService.createSubscriptionCheckout(session.user.id, returnUrl);
        return result;
    } catch (error: any) {
        console.error('[Priority Pass Upgrade Error]', error);
        return { success: false, error: error.message || 'Ошибка системы' };
    }
}

export async function checkPriorityPassStatus() {
    const session = await auth();
    if (!session?.user?.id) return false;
    return await SubscriptionService.checkActiveSubscription(session.user.id);
}
