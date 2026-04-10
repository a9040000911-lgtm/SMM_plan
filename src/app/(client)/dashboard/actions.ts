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
import { auth } from '@/auth';

/**
 * Claim achievement reward
 */
export async function claimAchievementAction(achievementId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const result = await AchievementService.claimReward(achievementId, session.user.id);

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
        const session = await auth();
        // Fallback for IDOR prevention: Always use session ID if caller passes different ID
        const targetUserId = session?.user?.id;
        
        if (!targetUserId) {
             return { success: false, achievements: [] };
        }

        const achievements = await AchievementService.getUserAchievements(targetUserId);
        return { success: true, achievements };
    } catch (error) {
        console.error('[Achievement] Fetch error:', error);
        return { success: false, achievements: [] };
    }
}
