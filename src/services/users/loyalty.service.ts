/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { SettingsService } from '@/services/core';


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
        // --- FEATURE FLAG CHECK ---
        const { ProjectService, ProjectFeature } = await import('@/services/core/project.service');
        const isEnabled = await ProjectService.isFeatureEnabled(projectId, ProjectFeature.REFERRAL);
        if (!isEnabled) return 0;

        const user = await prisma.user.findUnique({ where: { id: userId } });

        // --- INDIVIDUAL PERCENT ---
        if (user?.referralPercent && user.referralPercent > 0) {
            return user.referralPercent;
        }

        const basePercent = await SettingsService.getNumber('REFERRAL_PERCENT', projectId, 10);

        // Pioneer Boost: 2x Referral Rate (or fixed 20%)
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

        // --- FEATURE FLAG CHECK ---
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

        // Scheme Selection (Default to CLASSIC)
        const scheme: LoyaltyScheme = config.loyaltyScheme || 'CLASSIC';
        // ... rest of logic remains but is now protected
        // ... (Skipping full text for brevity in this specific tool call if possible, 
        // but multi_replace requires full replacement of the range)

        // 1. Check Early Bird status (20% discount)
        let earlyBirdDiscount = 0;
        const isEarlyBirdEnabled = loyaltySettings?.earlyBird !== false;

        if (isEarlyBirdEnabled && user) {
            if (user.isEarlyBird) {
                earlyBirdDiscount = 20;
            } else {
                // Check if user should become Early Bird (first 300 users)
                const userCount = await prisma.user.count({ where: { projectId, createdAt: { lte: user.createdAt } } });
                if (userCount <= 300) {
                    await prisma.user.update({ where: { id: user.id }, data: { isEarlyBird: true } });
                    earlyBirdDiscount = 20;
                }
            }
        }

        // 2. Calculate Base Loyalty based on Scheme
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

    // --- STRATEGIES ---

    private static async calculateClassicLoyalty(spent: number, projectId?: string | null) {
        const levels = await SettingsService.getJson<LoyaltyLevel[]>('LOYALTY_CONFIG_JSON', projectId!) || LOYALTY_LEVELS;
        const level = [...levels].sort((a, b) => b.min - a.min).find(l => spent >= l.min) || levels[0];
        const nextLevel = [...levels].sort((a, b) => a.min - b.min).find(l => l.min > spent);

        return { level, nextLevel, discount: level.discount };
    }

    private static calculateGamifiedLoyalty(spent: number) {
        // 1000 RUB = 1 Level. Max Level 50.
        // Discount = 0.2% per level (Max 10%).
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

    /**
     * Checks if a user is eligible for Pioneer status based on completed order rank.
     */
    static async isUserPioneer(userId: string): Promise<boolean> {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        return !!user?.earlyBirdRank;
    }

    /**
     * Checks if a refund should trigger a rollback of loyalty rewards.
     * To be called INSIDE a transaction.
     */
    static async checkAndRollbackRewards(tx: any, userId: string, currentSpent: number, refundAmount: number) {
        const newSpent = currentSpent - refundAmount;

        // 1. Find all loyalty logs for SPEND_GTE triggers
        const logs = await tx.loyaltyLog.findMany({
            where: {
                userId,
                trigger: { startsWith: 'SPEND_GTE' }
            }
        });

        for (const log of logs) {
            // Trigger format: SPEND_GTE:5000
            const threshold = parseFloat(log.trigger.split(':')[1]);

            // If the new total spent is BELOW the threshold, we must rollback
            if (newSpent < threshold) {
                console.log(`[Loyalty Rollback] User ${userId} dropped below ${threshold} (New: ${newSpent}). Revoking reward: ${log.reward}`);

                // Revoke based on reward type
                if (log.reward.startsWith('BALANCE:+')) {
                    const amount = parseFloat(log.reward.split('+')[1]);
                    // Deduct from balance
                    await tx.user.update({
                        where: { id: userId },
                        data: { balance: { decrement: amount } }
                    });

                    const { LedgerService } = await import('@/services/finance/ledger.service');
                    await LedgerService.record(tx, userId, new (await import('decimal.js')).Decimal(amount), 'MANUAL_ADJUSTMENT', log.id, `Откат бонуса лояльности: ${log.reward}`);
                } else if (log.reward.startsWith('PROMO:')) {
                    const code = log.reward.split(':')[1];
                    await tx.promoCode.updateMany({
                        where: { code, projectId: log.projectId },
                        data: { isActive: false }
                    });
                }

                // DELETE the log so they can earn it again
                await tx.loyaltyLog.delete({ where: { id: log.id } });
            }
        }
    }
}
