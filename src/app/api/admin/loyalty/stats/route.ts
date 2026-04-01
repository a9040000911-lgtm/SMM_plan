/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/utils/admin-session';

import { sanitizeData } from '@/utils/service-sanitizer';

export async function GET() {
    const session = await getAdminSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const [loyaltyConfig, rewardRules, stats, loyaltyStats] = await Promise.all([
            prisma.settings.findFirst({ where: { key: 'LOYALTY_CONFIG_JSON' } }),
            prisma.settings.findFirst({ where: { key: 'REWARD_RULES_JSON' } }),
            prisma.user.aggregate({
                _sum: { spent: true },
                _count: { id: true }
            }),
            prisma.ledgerEntry.aggregate({
                where: { description: { contains: 'loyalty', mode: 'insensitive' } },
                _sum: { amount: true },
                _count: { id: true }
            })
        ]);

        let levels = [
            { name: '🥉 BRONZE', min: 0, discount: 0 },
            { name: '🥈 SILVER', min: 5000, discount: 3 },
            { name: '🥇 GOLD', min: 15000, discount: 7 }
        ];
        if (loyaltyConfig?.value) {
            try {
                levels = JSON.parse(loyaltyConfig.value);
            } catch (e) {
                console.error('Failed to parse loyalty config:', e);
            }
        }

        let rules = [
            { trigger: 'REGISTRATION', conditionValue: 0, rewardType: 'PROMO_ISSUE', rewardValue: 5, description: 'Приветственный бонус' }
        ];
        if (rewardRules?.value) {
            try {
                rules = JSON.parse(rewardRules.value);
            } catch (e) {
                console.error('Failed to parse reward rules:', e);
            }
        }

        return NextResponse.json(sanitizeData({ levels, rules, stats, loyaltyStats }));
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}


