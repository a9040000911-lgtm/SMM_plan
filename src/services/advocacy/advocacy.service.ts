/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { bot } from '@/lib/bot';
import { Markup } from 'telegraf';
import { Decimal } from 'decimal.js';

/**
 * AdvocacyService (Phase 10B)
 * Handles NPS surveys, UGC incentives, and pioneer amplification
 */
export class AdvocacyService {
    /**
     * Send NPS survey to user via Telegram 24h after order completion
     */
    static async sendNPSSurvey(userId: string, orderId: string): Promise<boolean> {
        try {
            // Check if survey already sent for this order
            const existing = await prisma.nPSSurvey.findFirst({
                where: { userId, orderId: parseInt(orderId.toString()) }
            });

            if (existing) {
                console.log(`[NPS] Survey already sent for order ${orderId}`);
                return false;
            }

            // Check survey frequency (max 1 per 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const recentSurvey = await prisma.nPSSurvey.findFirst({
                where: {
                    userId,
                    createdAt: { gte: thirtyDaysAgo }
                }
            });

            if (recentSurvey) {
                console.log(`[NPS] User ${userId} already surveyed in last 30 days`);
                return false;
            }

            // Check user eligibility (must have 3+ completed orders)
            const completedOrders = await prisma.order.count({
                where: { userId, status: 'COMPLETED' }
            });

            if (completedOrders < 3) {
                console.log(`[NPS] User ${userId} has only ${completedOrders} orders, skipping survey`);
                return false;
            }

            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user?.tgId) return false;

            // Send NPS survey via Telegram
            const message = `📊 <b>Оцените наш сервис!</b>\n\nКак вы оцениваете вероятность того, что порекомендуете нас другу?\n\nВыберите от 0 (точно нет) до 10 (обязательно порекомендую):`;

            const keyboard = Markup.inlineKeyboard([
                [0, 1, 2, 3, 4],
                [5, 6, 7, 8],
                [9, 10]
            ].map(row => row.map(score =>
                Markup.button.callback(score.toString(), `nps_${orderId}_${score}`)
            )));

            await bot.telegram.sendMessage(Number(user.tgId), message, {
                parse_mode: 'HTML',
                ...keyboard
            });

            return true;
        } catch (err) {
            console.error('[NPS] Failed to send survey:', err);
            return false;
        }
    }

    /**
     * Record NPS survey response
     */
    static async recordNPSResponse(
        userId: string,
        orderId: string,
        score: number,
        comment?: string
    ): Promise<void> {
        const user = await prisma.user.findUnique({ where: { id: userId } });

        await prisma.nPSSurvey.create({
            data: {
                userId,
                orderId: parseInt(orderId.toString()),
                projectId: user?.projectId || undefined,
                score,
                comment
            }
        });

        // Send thank you message with context-specific follow-up
        if (!user?.tgId) return;

        let followUpMessage = '';
        if (score <= 6) {
            // Detractors
            followUpMessage = '\n\n💬 <i>Что мы можем улучшить? Напишите нам в поддержку, мы обязательно учтем ваши пожелания!</i>';
        } else if (score <= 8) {
            // Passives
            followUpMessage = '\n\n💡 <i>Как сделать ваш опыт еще лучше? Расскажите нам в поддержке!</i>';
        } else {
            // Promoters
            followUpMessage = '\n\n🎁 <i>Спасибо! Поделитесь нами с друзьями и получите бонус за каждого приглашенного!</i>\n\nВаша реферальная ссылка: /referral';
        }

        await bot.telegram.sendMessage(
            Number(user.tgId),
            `✅ <b>Спасибо за оценку!</b>${followUpMessage}`,
            { parse_mode: 'HTML' }
        );
    }

    /**
     * Get NPS analytics for project
     */
    static async getNPSAnalytics(projectId?: string): Promise<{
        score: number;
        promoters: number;
        passives: number;
        detractors: number;
        totalResponses: number;
    }> {
        const surveys = await prisma.nPSSurvey.findMany({
            where: projectId ? { projectId } : {},
            select: { score: true }
        });

        if (surveys.length === 0) {
            return { score: 0, promoters: 0, passives: 0, detractors: 0, totalResponses: 0 };
        }

        const promoters = surveys.filter((s: any) => s.score >= 9).length;
        const passives = surveys.filter((s: any) => s.score >= 7 && s.score <= 8).length;
        const detractors = surveys.filter((s: any) => s.score <= 6).length;
        const total = surveys.length;

        // NPS = % Promoters - % Detractors
        const npsScore = Math.round(((promoters / total) - (detractors / total)) * 100);

        return {
            score: npsScore,
            promoters,
            passives,
            detractors,
            totalResponses: total
        };
    }

    /**
     * Request review from user after order completion
     */
    static async requestReview(userId: string, orderId: string): Promise<boolean> {
        try {
            // Check if review already exists
            const existing = await prisma.review.findFirst({
                where: { userId, orderId: parseInt(orderId.toString()) }
            });

            if (existing) return false;

            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user?.tgId) return false;

            const message = `⭐ <b>Оставьте отзыв!</b>\n\nНам очень важно узнать ваше мнение о нашем сервисе. Напишите отзыв и получите бонус 💰\n\nИспользуйте команду /review или напишите в поддержку.`;

            await bot.telegram.sendMessage(Number(user.tgId), message, {
                parse_mode: 'HTML'
            });

            return true;
        } catch (err) {
            console.error('[UGC] Failed to request review:', err);
            return false;
        }
    }

    /**
     * Reward user for quality review
     */
    static async rewardReview(
        reviewId: string,
        quality: 'LOW' | 'MEDIUM' | 'HIGH'
    ): Promise<{ success: boolean; amount: number }> {
        const review = await prisma.review.findUnique({
            where: { id: reviewId },
            include: { user: true }
        });

        if (!review || review.rewardClaimed || !review.userId || !review.user) {
            return { success: false, amount: 0 };
        }

        // Reward amounts based on quality
        const rewardAmounts = {
            LOW: 50,
            MEDIUM: 100,
            HIGH: 200
        };

        const rewardAmount = rewardAmounts[quality];
        const user = review.user; // Non-nullable local variable

        await prisma.$transaction(async (tx) => {
            // Update review with reward info
            await tx.review.update({
                where: { id: reviewId },
                data: {
                    qualityScore: quality,
                    rewardClaimed: true,
                    rewardAmount: new Decimal(rewardAmount)
                }
            });

            // Credit user balance
            await tx.user.update({
                where: { id: review.userId as string },
                data: {
                    balance: { increment: rewardAmount }
                }
            });

            // Create ledger entry
            await tx.ledgerEntry.create({
                data: {
                    userId: review.userId as string,
                    projectId: review.projectId,
                    amount: rewardAmount,
                    balanceBefore: user.balance,
                    balanceAfter: Number(user.balance) + rewardAmount,
                    type: 'MANUAL_ADJUSTMENT',
                    description: `Награда за отзыв (качество: ${quality})`
                }
            });
        });

        // Notify user
        if (user.tgId) {
            await bot.telegram.sendMessage(
                Number(user.tgId),
                `🎁 <b>Награда за отзыв!</b>\n\nСпасибо за ваш отзыв! На ваш баланс зачислено <b>${rewardAmount}₽</b>.`,
                { parse_mode: 'HTML' }
            );
        }

        return { success: true, amount: rewardAmount };
    }

    /**
     * Identify pioneer users (early adopters with high activity)
     */
    static async identifyPioneers(projectId?: string): Promise<Array<{
        userId: string;
        username: string | null;
        orderCount: number;
        referralCount: number;
        spent: number;
    }>> {
        const users = await prisma.user.findMany({
            where: {
                ...(projectId ? { projectId } : {}),
                earlyBirdRank: { not: null } // Early adopters
            },
            include: {
                orders: { where: { status: 'COMPLETED' } },
                referrals: true
            }
        });

        return users
            .filter(u => u.orders.length >= 10 || u.referrals.length >= 5) // High activity threshold
            .map(u => ({
                userId: u.id,
                username: u.username,
                orderCount: u.orders.length,
                referralCount: u.referrals.length,
                spent: Number(u.spent)
            }))
            .sort((a, b) => b.spent - a.spent);
    }

    /**
     * Reward pioneer for advocacy activity (review, referral, social share)
     */
    static async rewardPioneerActivity(
        userId: string,
        activityType: 'REVIEW' | 'REFERRAL' | 'SOCIAL_SHARE'
    ): Promise<boolean> {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.earlyBirdRank) return false;

        // Pioneer amplification: 2x rewards for early adopters
        const baseRewards = {
            REVIEW: 100,
            REFERRAL: 200,
            SOCIAL_SHARE: 50
        };

        const bonusAmount = baseRewards[activityType] * 2; // 2x multiplier

        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: userId },
                data: { balance: { increment: bonusAmount } }
            });

            await tx.ledgerEntry.create({
                data: {
                    userId,
                    projectId: user.projectId,
                    amount: bonusAmount,
                    balanceBefore: user.balance,
                    balanceAfter: Number(user.balance) + bonusAmount,
                    type: 'MANUAL_ADJUSTMENT',
                    description: `Pioneer Amplification (2x): ${activityType}`
                }
            });
        });

        if (user.tgId) {
            await bot.telegram.sendMessage(
                Number(user.tgId),
                `🌟 <b>Pioneer Bonus!</b>\n\nЗа вашу активность начислено <b>${bonusAmount}₽</b> (2x multiplier для ранних пользователей!)`,
                { parse_mode: 'HTML' }
            );
        }

        return true;
    }
}
