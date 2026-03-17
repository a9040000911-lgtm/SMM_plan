/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { SettingsService } from '@/services/core/settings.service';

export interface LoyaltyLevel {
    name: string;
    min: number;
    discount: number;
}

export const LOYALTY_LEVELS: LoyaltyLevel[] = [
    { name: '🥉 BRONZE', min: 0, discount: 0 },
    { name: '🥈 SILVER', min: 5000, discount: 3 },
    { name: '🥇 GOLD', min: 15000, discount: 7 },
    { name: '💎 DIAMOND', min: 50000, discount: 10 },
];

export type LoyaltyScheme = 'CLASSIC' | 'GAMIFIED' | 'VIP';

export interface LoyaltyInfo {
    level: LoyaltyLevel;
    nextLevel?: LoyaltyLevel;
    loyaltyDiscount: number;
    totalDiscount: number;
    isEarlyBird: boolean;
}

export class LoyaltyService {
    static async getReferralPercent(userId: string, projectId: string): Promise<number> {
        const { ProjectService, ProjectFeature } = await import('@/services/core/project.service');
        const isEnabled = await ProjectService.isFeatureEnabled(projectId, ProjectFeature.REFERRAL);
        if (!isEnabled) return 0;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user?.referralPercent && user.referralPercent > 0) {
            return user.referralPercent;
        }

        const basePercent = await SettingsService.getNumber('REFERRAL_PERCENT', projectId, 10);
        if (user?.isEarlyBird) {
            return 20;
        }
        return basePercent;
    }

    static async getLoyaltyInfo(userId: string, spentAmount: number, projectId?: string | null): Promise<LoyaltyInfo> {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const project = projectId ? await prisma.project.findUnique({ where: { id: projectId } }) : null;
        const config = project?.config as any || {};
        const loyaltySettings = project?.loyaltySettings as any;

        const { ProjectService, ProjectFeature } = await import('@/services/core/project.service');
        const isLoyaltyEnabled = projectId ? await ProjectService.isFeatureEnabled(projectId, ProjectFeature.LOYALTY) : true;

        if (!isLoyaltyEnabled) {
            return {
                level: LOYALTY_LEVELS[0],
                loyaltyDiscount: 0,
                totalDiscount: 0,
                isEarlyBird: false
            };
        }

        const scheme: LoyaltyScheme = config.loyaltyScheme || 'CLASSIC';
        let earlyBirdDiscount = 0;
        const isEarlyBirdEnabled = loyaltySettings?.earlyBird !== false;

        if (isEarlyBirdEnabled && user) {
            if (user.isEarlyBird) {
                earlyBirdDiscount = 20;
            } else {
                const userCount = await prisma.user.count({ where: { projectId, createdAt: { lte: user.createdAt } } });
                if (userCount <= 300) {
                    await prisma.user.update({ where: { id: user.id }, data: { isEarlyBird: true } });
                    earlyBirdDiscount = 20;
                }
            }
        }

        let baseLoyalty: { level: LoyaltyLevel, nextLevel?: LoyaltyLevel, discount: number };
        switch (scheme) {
            case 'GAMIFIED':
                baseLoyalty = this.calculateGamifiedLoyalty(spentAmount);
                break;
            case 'VIP':
                baseLoyalty = this.calculateVipLoyalty(spentAmount);
                break;
            case 'CLASSIC':
            default:
                baseLoyalty = await this.calculateClassicLoyalty(spentAmount, projectId);
                break;
        }

        return {
            level: baseLoyalty.level,
            nextLevel: baseLoyalty.nextLevel,
            loyaltyDiscount: baseLoyalty.discount,
            totalDiscount: baseLoyalty.discount + earlyBirdDiscount,
            isEarlyBird: earlyBirdDiscount > 0
        };
    }

    private static async calculateClassicLoyalty(spent: number, projectId?: string | null) {
        const levels = await SettingsService.getJson<LoyaltyLevel[]>('LOYALTY_CONFIG_JSON', projectId!) || LOYALTY_LEVELS;
        const level = [...levels].sort((a, b) => b.min - a.min).find(l => spent >= l.min) || levels[0];
        const nextLevel = [...levels].sort((a, b) => a.min - b.min).find(l => l.min > spent);
        return { level, nextLevel, discount: level.discount };
    }

    private static calculateGamifiedLoyalty(spent: number) {
        const levelNum = Math.min(Math.floor(spent / 1000) + 1, 50);
        const discount = parseFloat(((levelNum - 1) * 0.2).toFixed(1));
        const currentLevel: LoyaltyLevel = {
            name: `LEVEL ${levelNum}`,
            min: (levelNum - 1) * 1000,
            discount
        };
        let nextLevel: LoyaltyLevel | undefined;
        if (levelNum < 50) {
            nextLevel = {
                name: `LEVEL ${levelNum + 1}`,
                min: levelNum * 1000,
                discount: parseFloat((levelNum * 0.2).toFixed(1))
            };
        }
        return { level: currentLevel, nextLevel, discount };
    }

    private static calculateVipLoyalty(spent: number) {
        const threshold = 50000;
        const isVip = spent >= threshold;
        if (isVip) {
            return {
                level: { name: '👑 VIP CLUB', min: threshold, discount: 15 },
                nextLevel: undefined,
                discount: 15
            };
        } else {
            return {
                level: { name: 'GUEST', min: 0, discount: 0 },
                nextLevel: { name: '👑 VIP CLUB', min: threshold, discount: 15 },
                discount: 0
            };
        }
    }

    static async isUserPioneer(userId: string): Promise<boolean> {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        return !!user?.earlyBirdRank;
    }

    static async checkAndRollbackRewards(tx: any, userId: string, currentSpent: number, refundAmount: number) {
        const newSpent = currentSpent - refundAmount;
        const logs = await tx.loyaltyLog.findMany({
            where: { userId, trigger: { startsWith: 'SPEND_GTE' } }
        });

        for (const log of logs) {
            const threshold = parseFloat(log.trigger.split(':')[1]);
            if (newSpent < threshold) {
                if (log.reward.startsWith('BALANCE:+')) {
                    const amount = parseFloat(log.reward.split('+')[1]);
                    await tx.user.update({
                        where: { id: userId },
                        data: { balance: { decrement: amount } }
                    });
                    const { LedgerService } = await import('@/services/finance/ledger.service');
                    const Decimal = (await import('decimal.js')).Decimal;
                    await LedgerService.record(tx, userId, new Decimal(amount), 'MANUAL_ADJUSTMENT', log.id, `Откат бонуса лояльности: ${log.reward}`);
                } else if (log.reward.startsWith('PROMO:')) {
                    const code = log.reward.split(':')[1];
                    await tx.promoCode.updateMany({
                        where: { code, projectId: log.projectId },
                        data: { isActive: false }
                    });
                }
                await tx.loyaltyLog.delete({ where: { id: log.id } });
            }
        }
    }
}
