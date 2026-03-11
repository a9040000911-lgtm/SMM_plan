/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { AchievementType, ChallengeType } from '@/generated/client';

/**
 * Achievement System Service (Phase 10A)
 * Handles badge unlocking, claiming rewards, and challenge progress tracking
 */

// Achievement metadata and rewards
export const ACHIEVEMENT_CONFIG: Record<AchievementType, {
    name: string;
    description: string;
    icon: string;
    reward: { type: 'BALANCE' | 'DISCOUNT' | 'STATUS', value: number };
}> = {
    FIRST_BLOOD: {
        name: 'First Blood',
        description: 'Completed your first order',
        icon: '💎',
        reward: { type: 'BALANCE', value: 200 }
    },
    HOT_STREAK: {
        name: 'Hot Streak',
        description: '5 consecutive weekly orders',
        icon: '🔥',
        reward: { type: 'BALANCE', value: 1000 }
    },
    REFERRAL_KING: {
        name: 'Referral King',
        description: '50 successful referrals',
        icon: '👑',
        reward: { type: 'STATUS', value: 1 } // Permanent VIP
    },
    SPEED_DEMON: {
        name: 'Speed Demon',
        description: '10 orders in a single day',
        icon: '⚡',
        reward: { type: 'BALANCE', value: 500 }
    },
    BULLSEYE: {
        name: 'Bullseye',
        description: 'Made an order worth exactly 1000₽',
        icon: '🎯',
        reward: { type: 'BALANCE', value: 100 }
    },
    PIONEER_LEGEND: {
        name: 'Pioneer Legend',
        description: '100+ successful referrals',
        icon: '🌟',
        reward: { type: 'BALANCE', value: 5000 }
    },
    BIG_SPENDER: {
        name: 'Big Spender',
        description: 'Spent over 50,000₽ total',
        icon: '💰',
        reward: { type: 'DISCOUNT', value: 10 }
    },
    LOYAL_CUSTOMER: {
        name: 'Loyal Customer',
        description: 'Active for 6 months',
        icon: '⭐',
        reward: { type: 'BALANCE', value: 1500 }
    },
    EARLY_ADOPTER: {
        name: 'Early Adopter',
        description: 'Joined in the first 100 users',
        icon: '🚀',
        reward: { type: 'DISCOUNT', value: 5 }
    },
    SOCIAL_BUTTERFLY: {
        name: 'Social Butterfly',
        description: 'Shared on 5 different platforms',
        icon: '🦋',
        reward: { type: 'BALANCE', value: 300 }
    }
};

export const CHALLENGE_CONFIG: Record<ChallengeType, {
    name: string;
    description: string;
    target: number;
    duration: number; // hours
    reward: { type: 'BALANCE' | 'DISCOUNT', value: number };
}> = {
    TRIPLE_THREAT: {
        name: 'Triple Threat',
        description: 'Make 3 orders this week',
        target: 3,
        duration: 7 * 24,
        reward: { type: 'BALANCE', value: 500 }
    },
    SOCIAL_SHARE: {
        name: 'Social Butterfly',
        description: 'Share 5 referrals',
        target: 5,
        duration: 30 * 24,
        reward: { type: 'BALANCE', value: 1000 }
    },
    EARLY_BIRD: {
        name: 'Early Bird',
        description: 'Order before 10 AM',
        target: 1,
        duration: 24,
        reward: { type: 'DISCOUNT', value: 5 }
    },
    WEEKEND_WARRIOR: {
        name: 'Weekend Warrior',
        description: '5 orders on weekend',
        target: 5,
        duration: 48,
        reward: { type: 'BALANCE', value: 750 }
    },
    SPENDING_SPREE: {
        name: 'Spending Spree',
        description: 'Spend 5000₽ this month',
        target: 5000,
        duration: 30 * 24,
        reward: { type: 'BALANCE', value: 500 }
    }
};

export class AchievementService {
    /**
     * Check and unlock achievement if conditions are met
     */
    static async checkAndUnlock(userId: string, trigger: AchievementType): Promise<boolean> {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.projectId) return false;

        // --- FEATURE FLAG CHECK ---
        const { ProjectService, ProjectFeature } = await import('@/services/core/project.service');
        const isEnabled = await ProjectService.isFeatureEnabled(user.projectId, ProjectFeature.GAMIFICATION);
        if (!isEnabled) return false;

        // Check if already unlocked
        const existing = await prisma.achievement.findUnique({
            where: { userId_type: { userId, type: trigger } }
        });

        if (existing) return false;

        // Verify conditions based on trigger type
        const conditionMet = await this.verifyCondition(userId, trigger);

        if (!conditionMet) return false;

        // Unlock achievement
        await prisma.achievement.create({
            data: {
                userId,
                type: trigger
            }
        });

        return true;
    }

    /**
     * Check all possible achievements for a user (trigger after order/referral events)
     */
    static async checkAllAchievements(userId: string): Promise<void> {
        const allTypes: AchievementType[] = Object.keys(ACHIEVEMENT_CONFIG) as AchievementType[];

        for (const type of allTypes) {
            try {
                await this.checkAndUnlock(userId, type);
            } catch (err) {
                console.error(`[Achievement] Failed to check ${type}:`, err);
            }
        }
    }

    /**
     * Verify if user meets achievement conditions
     */
    private static async verifyCondition(userId: string, type: AchievementType): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                orders: true,
                referrals: true
            }
        });

        if (!user) return false;

        switch (type) {
            case 'FIRST_BLOOD':
                return user.orders.length >= 1;

            case 'HOT_STREAK': {
                // Check last 5 weeks for consecutive orders
                const now = new Date();
                let consecutiveWeeks = 0;
                for (let i = 0; i < 5; i++) {
                    const weekStart = new Date(now);
                    weekStart.setDate(now.getDate() - (i + 1) * 7);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 7);

                    const ordersInWeek = user.orders.filter(o =>
                        o.createdAt >= weekStart && o.createdAt < weekEnd
                    );

                    if (ordersInWeek.length > 0) consecutiveWeeks++;
                    else break;
                }
                return consecutiveWeeks >= 5;
            }

            case 'REFERRAL_KING':
                return user.referrals.length >= 50;

            case 'SPEED_DEMON': {
                // Check if any single day has 10+ orders
                const ordersByDay = new Map<string, number>();
                user.orders.forEach(order => {
                    const dateKey = order.createdAt.toISOString().split('T')[0];
                    ordersByDay.set(dateKey, (ordersByDay.get(dateKey) || 0) + 1);
                });
                return Array.from(ordersByDay.values()).some(count => count >= 10);
            }

            case 'BULLSEYE': {
                // Check if any order is exactly 1000₽
                return user.orders.some(o => Number(o.totalPrice) === 1000);
            }

            case 'PIONEER_LEGEND':
                return user.referrals.length >= 100;

            case 'BIG_SPENDER':
                return Number(user.spent) >= 50000;

            case 'LOYAL_CUSTOMER': {
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                return user.createdAt <= sixMonthsAgo;
            }

            case 'EARLY_ADOPTER': {
                const allUsers = await prisma.user.count({
                    where: { projectId: user.projectId }
                });
                const olderUsers = await prisma.user.count({
                    where: {
                        projectId: user.projectId,
                        createdAt: { lt: user.createdAt }
                    }
                });
                return olderUsers < 100 && allUsers >= 100;
            }

            case 'SOCIAL_BUTTERFLY':
                // TODO: Track social shares separately
                return false;

            default:
                return false;
        }
    }

    /**
     * Get all user achievements
     */
    static async getUserAchievements(userId: string) {
        const achievements = await prisma.achievement.findMany({
            where: { userId },
            orderBy: { unlockedAt: 'desc' }
        });

        return achievements.map((ach: any) => ({
            ...ach,
            ...ACHIEVEMENT_CONFIG[ach.type as AchievementType]
        }));
    }

    /**
     * Claim achievement reward
     */
    static async claimReward(achievementId: string): Promise<{ success: boolean; reward?: any }> {
        const achievement = await prisma.achievement.findUnique({
            where: { id: achievementId },
            include: { user: true }
        });

        if (!achievement || achievement.claimed) {
            return { success: false };
        }

        const config = ACHIEVEMENT_CONFIG[achievement.type as AchievementType];
        const { reward } = config;

        // Apply reward
        if (reward.type === 'BALANCE') {
            await prisma.user.update({
                where: { id: achievement.userId },
                data: {
                    balance: { increment: reward.value }
                }
            });

            await prisma.ledgerEntry.create({
                data: {
                    userId: achievement.userId,
                    projectId: achievement.user.projectId,
                    amount: reward.value,
                    balanceBefore: achievement.user.balance,
                    balanceAfter: Number(achievement.user.balance) + reward.value,
                    type: 'MANUAL_ADJUSTMENT',
                    description: `Achievement Reward: ${config.name}`
                }
            });
        }

        // Mark as claimed
        await prisma.achievement.update({
            where: { id: achievementId },
            data: {
                claimed: true,
                claimedAt: new Date()
            }
        });

        return { success: true, reward };
    }
}

export class ChallengeService {
    /**
     * Create or get active challenge for user
     */
    static async getOrCreateChallenge(userId: string, type: ChallengeType) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.projectId) throw new Error('User or Project not found');

        // --- FEATURE FLAG CHECK ---
        const { ProjectService, ProjectFeature } = await import('@/services/core/project.service');
        const isEnabled = await ProjectService.isFeatureEnabled(user.projectId, ProjectFeature.GAMIFICATION);
        if (!isEnabled) throw new Error('Gamification is disabled for this project');

        const config = CHALLENGE_CONFIG[type];
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + config.duration);

        // Find active challenge
        let challenge = await prisma.challenge.findFirst({
            where: {
                userId,
                type,
                completed: false,
                expiresAt: { gt: new Date() }
            }
        });

        if (!challenge) {
            challenge = await prisma.challenge.create({
                data: {
                    userId,
                    type,
                    target: config.target,
                    expiresAt
                }
            });
        }

        return challenge;
    }

    /**
     * Update challenge progress
     */
    static async updateProgress(userId: string, type: ChallengeType, increment: number = 1) {
        const challenge = await this.getOrCreateChallenge(userId, type);

        if (challenge.completed) return challenge;

        const newProgress = challenge.progress + increment;
        const completed = newProgress >= challenge.target;

        const updated = await prisma.challenge.update({
            where: { id: challenge.id },
            data: {
                progress: newProgress,
                completed,
                completedAt: completed ? new Date() : undefined
            }
        });

        // Auto-reward if completed
        if (completed) {
            const config = CHALLENGE_CONFIG[type];
            await prisma.user.update({
                where: { id: userId },
                data: {
                    balance: { increment: config.reward.value }
                }
            });
        }

        return updated;
    }

    /**
     * Get active challenges for user
     */
    static async getActiveChallenges(userId: string) {
        const challenges = await prisma.challenge.findMany({
            where: {
                userId,
                expiresAt: { gt: new Date() }
            },
            orderBy: { createdAt: 'desc' }
        });

        return challenges.map((ch: any) => ({
            ...ch,
            ...CHALLENGE_CONFIG[ch.type as ChallengeType]
        }));
    }
}
