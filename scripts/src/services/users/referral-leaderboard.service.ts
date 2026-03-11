/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';

/**
 * ReferralLeaderboardService (Phase 10B)
 * Manages monthly referral leaderboards and tier-based rewards
 */
export class ReferralLeaderboardService {
    // Tier thresholds based on referred user's lifetime value (LTV)
    private static TIER_THRESHOLDS = {
        1: { min: 0, max: 1000, bonusPercent: 10 },      // 10% bonus
        2: { min: 1000, max: 5000, bonusPercent: 15 },   // 15% bonus
        3: { min: 5000, max: Infinity, bonusPercent: 20 } // 20% bonus
    };

    /**
     * Calculate tier based on referred user's LTV
     */
    static calculateTier(ltv: number): number {
        if (ltv >= 5000) return 3;
        if (ltv >= 1000) return 2;
        return 1;
    }

    /**
     * Get tier bonus percentage
     */
    static getTierBonus(tier: number): number {
        return this.TIER_THRESHOLDS[tier as (1 | 2 | 3)]?.bonusPercent || 0;
    }

    /**
     * Calculate tiered referral bonus
     */
    static calculateTieredBonus(baseBonus: Decimal, referredUserLTV: number): {
        tier: number;
        bonusPercent: number;
        finalBonus: Decimal;
    } {
        const tier = this.calculateTier(referredUserLTV);
        const bonusPercent = this.getTierBonus(tier);

        // Apply tier multiplier: base + (base * bonusPercent / 100)
        const finalBonus = baseBonus.mul(1 + bonusPercent / 100);

        return { tier, bonusPercent, finalBonus };
    }

    /**
     * Update monthly leaderboard for referrer
     */
    static async updateMonthlyLeaderboard(
        userId: string,
        projectId: string | null,
        bonusAmount: Decimal
    ): Promise<void> {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        await prisma.referralLeaderboard.upsert({
            where: {
                userId_month: {
                    userId,
                    month: monthStart
                }
            },
            create: {
                userId,
                projectId,
                month: monthStart,
                referralCount: 1,
                revenue: bonusAmount
            },
            update: {
                referralCount: { increment: 1 },
                revenue: { increment: bonusAmount }
            }
        });

        // Recalculate ranks for this month
        await this.calculateRanks(monthStart, projectId);
    }

    /**
     * Calculate and update ranks for a specific month
     */
    static async calculateRanks(month: Date, projectId: string | null): Promise<void> {
        const leaderboard = await prisma.referralLeaderboard.findMany({
            where: {
                month,
                ...(projectId ? { projectId } : {})
            },
            orderBy: [
                { revenue: 'desc' },
                { referralCount: 'desc' }
            ]
        });

        for (let i = 0; i < leaderboard.length; i++) {
            await prisma.referralLeaderboard.update({
                where: { id: leaderboard[i].id },
                data: { rank: i + 1 }
            });
        }
    }

    /**
     * Get leaderboard for a specific month
     */
    static async getLeaderboard(
        month: Date,
        projectId: string | null,
        limit: number = 10
    ): Promise<Array<{
        rank: number;
        userId: string;
        username: string | null;
        referralCount: number;
        revenue: string;
    }>> {
        const entries = await prisma.referralLeaderboard.findMany({
            where: {
                month,
                ...(projectId ? { projectId } : {})
            },
            orderBy: { rank: 'asc' },
            take: limit,
            include: {
                user: {
                    select: {
                        username: true,
                        tgId: true
                    }
                }
            }
        });

        return entries.map(entry => ({
            rank: entry.rank || 999,
            userId: entry.userId,
            username: entry.user.username || `User ${entry.user.tgId}`,
            referralCount: entry.referralCount,
            revenue: entry.revenue.toString()
        }));
    }

    /**
     * Get user's rank for a specific month
     */
    static async getUserRank(
        userId: string,
        month: Date
    ): Promise<{
        rank: number | null;
        referralCount: number;
        revenue: string;
    } | null> {
        const entry = await prisma.referralLeaderboard.findUnique({
            where: {
                userId_month: { userId, month }
            }
        });

        if (!entry) return null;

        return {
            rank: entry.rank,
            referralCount: entry.referralCount,
            revenue: entry.revenue.toString()
        };
    }

    /**
     * Get user's referral stats (all-time and current month)
     */
    static async getUserStats(userId: string): Promise<{
        totalReferrals: number;
        totalEarnings: string;
        currentMonthCount: number;
        currentMonthRevenue: string;
        currentRank: number | null;
        tierBreakdown: { tier1: number; tier2: number; tier3: number };
    }> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                referralEarnings: true,
                referrals: {
                    select: {
                        id: true,
                        spent: true
                    }
                }
            }
        });

        if (!user) {
            throw new Error('User not found');
        }

        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const currentMonthEntry = await this.getUserRank(userId, monthStart);

        // Calculate tier breakdown
        const tierBreakdown = { tier1: 0, tier2: 0, tier3: 0 };
        user.referrals.forEach(ref => {
            const ltv = Number(ref.spent);
            const tier = this.calculateTier(ltv);
            if (tier === 1) tierBreakdown.tier1++;
            else if (tier === 2) tierBreakdown.tier2++;
            else if (tier === 3) tierBreakdown.tier3++;
        });

        return {
            totalReferrals: user.referrals.length,
            totalEarnings: user.referralEarnings.toString(),
            currentMonthCount: currentMonthEntry?.referralCount || 0,
            currentMonthRevenue: currentMonthEntry?.revenue || '0',
            currentRank: currentMonthEntry?.rank || null,
            tierBreakdown
        };
    }
}
