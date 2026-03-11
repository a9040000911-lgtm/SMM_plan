'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateLoyaltySettingsAction(formData: FormData) {
    try {
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

        // Save to global settings (projectId: null)
        const upsertSetting = async (key: string, value: string) => {
            const existing = await prisma.settings.findFirst({
                where: { projectId: null, key }
            });
            if (existing) {
                await prisma.settings.update({
                    where: { id: existing.id },
                    data: { value }
                });
            } else {
                await prisma.settings.create({
                    data: { projectId: null, key, value }
                });
            }
        };

        await upsertSetting('LOYALTY_CONFIG_JSON', JSON.stringify(levels));
        await upsertSetting('REWARD_RULES_JSON', JSON.stringify(rules));

        revalidatePath('/admin/loyalty');
    } catch (error) {
        console.error('Failed to update loyalty settings:', error);
        // In a real app we might want to throw to trigger error boundary or use useFormState
    }
}
