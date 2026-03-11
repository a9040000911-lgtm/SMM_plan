/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { formatAmount } from '@/utils/formatter';
import { Decimal } from 'decimal.js';
import { LedgerService } from '@/services/finance';
import { SettingsService } from '@/services/core';
import { AchievementService } from '@/services/gamification/achievement.service';
import { ReferralLeaderboardService } from './referral-leaderboard.service';

export class ReferralService {
    /**
     * Рассчитывает и начисляет реферальный бонус (Phase 10B: с tier logic)
     */
    static async processReferralBonus(txPrisma: any, userId: string, depositAmount: Decimal, transactionId: string) {
        const user = await txPrisma.user.findUnique({
            where: { id: userId },
            include: { referrer: true, project: true }
        });

        if (!user?.referrerId) return;

        // Check if referral system is enabled for this project
        const loyaltySettings = user.project?.loyaltySettings as any;
        if (user.project && loyaltySettings?.referrals === false) return;

        const pct = await SettingsService.getNumber('REFERRAL_PERCENT', user.projectId, 10);
        const baseBonus = depositAmount.mul(pct).div(100);

        // Phase 10B: Calculate tiered bonus based on referred user's LTV
        const referredUserLTV = Number(user.spent);
        const { tier, bonusPercent, finalBonus } = ReferralLeaderboardService.calculateTieredBonus(
            baseBonus,
            referredUserLTV
        );

        // ЗАПИСЬ В LEDGER (РЕФЕРАЛЬНЫЙ БОНУС С TIER MULTIPLIER)
        const description = `Реферальный бонус от ${user.username || user.id} (Tier ${tier}: +${bonusPercent}%)`;
        await LedgerService.record(txPrisma, user.referrerId, finalBonus, 'REFERRAL_BONUS', transactionId, description);

        const referrer = await txPrisma.user.update({
            where: { id: user.referrerId },
            data: {
                balance: { increment: finalBonus },
                referralEarnings: { increment: finalBonus }
            }
        });

        // Phase 10B: Update monthly leaderboard
        await ReferralLeaderboardService.updateMonthlyLeaderboard(
            user.referrerId,
            user.projectId,
            finalBonus
        );

        try {
            // eslint-disable-next-line unused-imports/no-unused-vars
            const { BotRegistry, bot } = await import('@/lib/bot');
            const { NotificationTemplates } = await import('@/bot/utils/notification-templates');
            const botInstance = BotRegistry.get(user.projectId);
            const tierBadge = tier === 3 ? '🏆' : tier === 2 ? '⭐' : '💫';

            await botInstance.telegram.sendMessage(
                Number(referrer.tgId),
                NotificationTemplates.FINANCE.REFERRAL_BONUS_USER(
                    tierBadge,
                    tier === 1 ? '' : `Tier ${tier}`,
                    formatAmount(finalBonus),
                    tier > 1 ? ` (+${bonusPercent}% bonus)` : ''
                ),
                { parse_mode: 'HTML' }
            );
        } catch (_e) {
            console.error('Failed to send referral bonus notification:', _e);
        }

        // ACHIEVEMENT UNLOCK: Referral bonus received
        try {
            await AchievementService.checkAllAchievements(user.referrerId);
        } catch (achErr) {
            console.error('[Achievement] Failed to check achievements for referrer:', achErr);
        }
    }
}
