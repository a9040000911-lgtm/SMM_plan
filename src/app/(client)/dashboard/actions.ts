'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 * 
 * Gamification Server Actions — migrated from legacy /profile route.
 */

import { AchievementService } from '@/services/gamification/achievement.service';
import { revalidatePath } from 'next/cache';

/**
 * Claim achievement reward
 */
export async function claimAchievementAction(achievementId: string) {
    try {
        const result = await AchievementService.claimReward(achievementId);

        if (!result.success) {
            return { success: false, error: 'Failed to claim reward' };
        }

        revalidatePath('/dashboard');

        return { success: true, reward: result.reward };
    } catch (error) {
        console.error('[Achievement] Claim error:', error);
        return { success: false, error: 'Internal error' };
    }
}

/**
 * Get user achievements for display
 */
export async function getUserAchievementsAction(userId: string) {
    try {
        const achievements = await AchievementService.getUserAchievements(userId);
        return { success: true, achievements };
    } catch (error) {
        console.error('[Achievement] Fetch error:', error);
        return { success: false, achievements: [] };
    }
}
