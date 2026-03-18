/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';

export type UserSegment = 'NEWCOMER' | 'SILENT' | 'POWER_USER' | 'ADVOCATE' | 'CHURN_RISK';

export interface AIInsight {
    type: 'SEGMENT' | 'NPS' | 'REFERRAL' | 'CHURN';
    title: string;
    message: string;
    level: 'INFO' | 'WARNING' | 'SUCCESS';
}

export interface AIRecommendation {
    id: string;
    title: string;
    description: string;
    actionLabel: string;
    actionUrl: string;
    icon: string;
}

export class LoyaltyAIService {
    /**
     * Get AI-driven insights and recommendations for a user
     * Phase 10C: AI & Analytics
     */
    static async getUserAnalysis(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                npsSurveys: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                },
                referralLeaderboards: {
                    orderBy: { month: 'desc' },
                    take: 1
                },
                challenges: {
                    where: { completed: false },
                    take: 3
                }
            }
        });

        if (!user) throw new Error('User not found');

        // Fetch latest churn prediction if any
        const churnPrediction = await prisma.churnPrediction.findFirst({
            where: {
                order: { userId }
            },
            orderBy: { createdAt: 'desc' }
        });

        const segment = this.determineSegment(user, churnPrediction);
        const insights = this.generateInsights(user, churnPrediction, segment);
        const recommendations = this.generateRecommendations(user, churnPrediction, segment);

        return {
            userId,
            username: user.username,
            segment,
            insights,
            recommendations
        };
    }

    private static determineSegment(user: any, churnPrediction: any): UserSegment {
        const now = new Date();
        const createdDate = new Date(user.createdAt);
        const daysSinceJoined = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);

        // 1. Newcomer check
        if (daysSinceJoined < 7 && Number(user.spent) < 500) {
            return 'NEWCOMER';
        }

        // 2. Churn Risk check
        if (churnPrediction && Number(churnPrediction.predictedChurn) > 40) {
            return 'CHURN_RISK';
        }

        // 3. Power User check
        const totalSpent = Number(user.spent);
        const monthlyRevenue = user.referralLeaderboards[0] ? Number(user.referralLeaderboards[0].revenue) : 0;
        if (totalSpent > 10000 || monthlyRevenue > 5000) {
            return 'POWER_USER';
        }

        // 4. Advocate check
        const hasReferrals = user.referralCode && user.referralLeaderboards.length > 0;
        const nps = user.npsSurveys[0] ? user.npsSurveys[0].score : 0;
        if (hasReferrals || nps >= 9) {
            return 'ADVOCATE';
        }

        return 'SILENT';
    }

    private static generateInsights(user: any, churnPrediction: any, segment: UserSegment): AIInsight[] {
        const insights: AIInsight[] = [];

        // Segment insight
        const segmentTitles: Record<UserSegment, string> = {
            'NEWCOMER': 'Добро пожаловать!',
            'SILENT': 'Тихий режим',
            'POWER_USER': 'Топ-клиент',
            'ADVOCATE': 'Амбассадор бренда',
            'CHURN_RISK': 'В зоне риска'
        };

        const segmentMessages: Record<UserSegment, string> = {
            'NEWCOMER': 'Вы только начинаете свой путь. Мы подготовили для вас лучшие предложения.',
            'SILENT': 'Мы давно не видели активности. Возможно, вам стоит взглянуть на новые услуги?',
            'POWER_USER': 'Вы один из наших самых ценных клиентов. Ваша лояльность вдохновляет нас!',
            'ADVOCATE': 'Спасибо за то, что рекомендуете нас друзьям. Вы помогаете нам расти.',
            'CHURN_RISK': 'Мы заметили снижение активности ваших заказов. Нам важно, чтобы всё было идеально.'
        };

        insights.push({
            type: 'SEGMENT',
            title: segmentTitles[segment],
            message: segmentMessages[segment],
            level: segment === 'CHURN_RISK' ? 'WARNING' : segment === 'POWER_USER' ? 'SUCCESS' : 'INFO'
        });

        // NPS Insight
        if (user.npsSurveys[0]) {
            const lastNps = user.npsSurveys[0].score;
            if (lastNps >= 9) {
                insights.push({
                    type: 'NPS',
                    title: 'Высокая оценка',
                    message: 'Ваша последняя оценка 10/10 говорит о том, что нам можно доверять.',
                    level: 'SUCCESS'
                });
            } else if (lastNps <= 6) {
                insights.push({
                    type: 'NPS',
                    title: 'Мы исправляемся',
                    message: 'Мы получили ваш отзыв с низкой оценкой и работаем над улучшением сервиса.',
                    level: 'WARNING'
                });
            }
        }

        // Churn Insight
        if (segment === 'CHURN_RISK' && churnPrediction) {
            insights.push({
                type: 'CHURN',
                title: 'Внимание к подпискам',
                message: `Прогноз показывает риск оттока ${churnPrediction.predictedChurn}%. Проверьте свои заказы.`,
                level: 'WARNING'
            });
        }

        return insights;
    }

    private static generateRecommendations(user: any, churnPrediction: any, segment: UserSegment): AIRecommendation[] {
        const recommendations: AIRecommendation[] = [];

        // Referral Recommendation
        if (segment !== 'CHURN_RISK') {
            const currentTier = user.referralLeaderboards[0] ? 1 : 0; // Simplified
            if (currentTier < 2) {
                recommendations.push({
                    id: 'ref-tier-up',
                    title: 'Повысь свой Tier',
                    description: 'Пригласи 2 активных друзей, чтобы получать 15% бонуса вместо 10%.',
                    actionLabel: 'Пригласить',
                    actionUrl: '/referrals',
                    icon: '🚀'
                });
            }
        }

        // Challenge Recommendation
        if (user.challenges.length > 0) {
            const topChallenge = user.challenges[0];
            recommendations.push({
                id: 'challenge-progress',
                title: 'Цель близка!',
                description: `До завершения "${topChallenge.type}" осталось совсем немного.`,
                actionLabel: 'В челленджи',
                actionUrl: '/profile',
                icon: '🎯'
            });
        }

        // Support Recommendation for churn risk
        if (segment === 'CHURN_RISK') {
            recommendations.push({
                id: 'support-help',
                title: 'Нужна помощь?',
                description: 'Если у вас возникли проблемы с качеством услуг, наша поддержка готова помочь.',
                actionLabel: 'Написать нам',
                actionUrl: '/support',
                icon: '💬'
            });
        }

        // Default: Review if silent
        if (segment === 'SILENT') {
            recommendations.push({
                id: 'write-review',
                title: 'Поделись мнением',
                description: 'Оставь отзыв о последних заказах и получи до 100₽ на баланс.',
                actionLabel: 'Оставить отзыв',
                actionUrl: '/orders',
                icon: '⭐'
            });
        }

        return recommendations;
    }
}


