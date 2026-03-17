'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/utils/admin-session';
import { AdminDataService } from '@/services/admin/admin-data.service';
import { AdminContext } from '@/services/types';

async function requireAdmin(): Promise<AdminContext> {
    const session = await getAdminSession();
    if (!session || session.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }
    return {
        userId: session.id,
        role: session.role as any,
        allowedProjects: session.allowedProjects,
        isGlobalAdmin: session.isGlobalAdmin
    };
}

export async function updateLoyaltySettingsAction(formData: FormData) {
    try {
        const ctx = await requireAdmin();

        const levelsCount = parseInt(formData.get('levels_count') as string || '0');
        const levels = [];
        for (let i = 0; i < levelsCount; i++) {
            const name = formData.get(`level_name_${i}`);
            const min = formData.get(`level_min_${i}`);
            const discount = formData.get(`level_discount_${i}`);
            if (name && min && discount) {
                levels.push({
                    name: name.toString(),
                    min: parseFloat(min.toString()),
                    discount: parseFloat(discount.toString())
                });
            }
        }

        const rulesCount = parseInt(formData.get('rules_count') as string || '0');
        const rules = [];
        for (let i = 0; i < rulesCount; i++) {
            const trigger = formData.get(`rule_trigger_${i}`);
            const conditionValue = formData.get(`rule_conditionValue_${i}`);
            const rewardType = formData.get(`rule_rewardType_${i}`);
            const rewardValue = formData.get(`rule_rewardValue_${i}`);
            const description = formData.get(`rule_description_${i}`);

            if (trigger && conditionValue && rewardType && rewardValue) {
                rules.push({
                    trigger: trigger.toString(),
                    conditionValue: parseFloat(conditionValue.toString()),
                    rewardType: rewardType.toString(),
                    rewardValue: parseFloat(rewardValue.toString()),
                    description: description?.toString() || 'Без описания'
                });
            }
        }

        const result = await AdminDataService.updateLoyaltySettings(ctx, null, levels, rules);
        if (!result.success) throw new Error(result.error.message);

        revalidatePath('/admin/loyalty');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to update loyalty settings:', error);
        return { success: false, error: error.message };
    }
}
