/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { formatAmount } from '@/utils/formatter';
import { Decimal } from 'decimal.js';
import { LedgerService } from '@/services/finance/ledger.service';
import { SettingsService } from '@/services/core/settings.service';
import { AchievementService } from '@/services/gamification/achievement.service';
import { ReferralLeaderboardService } from './referral-leaderboard.service';
import { ServiceResult } from '../types';
import { prisma } from '@/lib/prisma';

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
            const { BotRegistry } = await import('@/lib/bot');
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

    /**
     * Fetches all data needed for the referral dashboard.
     */
    static async getReferralDashboardData(userId: string, projectId: string): Promise<ServiceResult<any>> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, email: true, username: true, referralEarnings: true }
            });

            if (!user) throw new Error('Пользователь не найден');

            // 1. Fetch leaderboard
            const leaderboard = await prisma.user.findMany({
                where: { projectId },
                take: 10,
                orderBy: { referralEarnings: 'desc' },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    referralEarnings: true,
                    _count: {
                        select: { referrals: true }
                    }
                }
            });

            const transformedLeaderboard = leaderboard.map((u, i) => ({
                rank: i + 1,
                userId: u.id,
                username: u.username || (u.email ? u.email.split('@')[0] : 'Partner'),
                referralCount: u._count.referrals,
                revenue: u.referralEarnings.toString(),
            }));

            // 2. User personal stats
            const referralsCount = await prisma.user.count({
                where: { referrerId: user.id }
            });

            const referralCode = user.id.split('-')[0];

            return {
                success: true,
                data: {
                    leaderboard: transformedLeaderboard,
                    userStats: {
                        totalReferrals: referralsCount,
                        totalEarnings: user.referralEarnings.toString(),
                        currentMonthCount: 0,
                        currentMonthRevenue: "0",
                        currentRank: null,
                        tierBreakdown: { tier1: referralsCount, tier2: 0, tier3: 0 },
                        referralCode
                    }
                }
            };
        } catch (error: any) {
            return {
                success: false,
                error: { code: 'REFERRAL_DATA_FETCH_FAILED', message: error.message }
            };
        }
    }
}
