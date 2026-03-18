'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { auth } from "@/auth";
import { revalidatePath } from 'next/cache';
import { UserService } from '@/services/users/user.service';

/**
 * Generates a new API Key for the authenticated user
 */
export async function generateApiKey() {
    try {
        const session = await auth();
        const userId = (session?.user as any)?.id;
        if (!userId) throw new Error('Не авторизован');

        const result = await UserService.generateApiKey(userId);
        
        if (result.success) {
            revalidatePath('/dashboard/api');
            return { success: true, key: result.data };
        } else {
            return { success: false, error: result.error.message };
        }
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Revokes (removes) the API Key for the authenticated user
 */
export async function revokeApiKey() {
    try {
        const session = await auth();
        const userId = (session?.user as any)?.id;
        if (!userId) throw new Error('Не авторизован');

        const result = await UserService.revokeApiKey(userId);

        if (result.success) {
            revalidatePath('/dashboard/api');
            return { success: true };
        } else {
            return { success: false, error: result.error.message };
        }
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Gets the current masked API Key (for safety) and status
 */
export async function getApiKeyInfo() {
    try {
        const session = await auth();
        const userId = (session?.user as any)?.id;
        if (!userId) throw new Error('Не авторизован');

        const result = await UserService.getApiKeyInfo(userId);

        if (result.success) {
            return {
                success: true,
                hasApiKey: result.data.hasApiKey,
                apiKey: result.data.apiKey
            };
        } else {
            return { success: false, error: result.error.message };
        }
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


