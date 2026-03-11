'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { auth } from "@/auth";

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';

/**
 * Generates a new API Key for the authenticated user
 */
export async function generateApiKey() {
    try {
        const session = await auth();
        const userId = (session?.user as any)?.id;
        if (!userId) throw new Error('Не авторизован');

        // Generate a high-entropy key: prefix_32chars
        const newKey = `smm_${crypto.randomBytes(24).toString('hex')}`;

        await prisma.user.update({
            where: { id: userId },
            data: { apiKey: newKey }
        });

        revalidatePath('/dashboard/api');
        return { success: true, key: newKey };
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

        await prisma.user.update({
            where: { id: userId },
            data: { apiKey: null }
        });

        revalidatePath('/dashboard/api');
        return { success: true };
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

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { apiKey: true }
        });

        return {
            success: true,
            hasApiKey: !!user?.apiKey,
            apiKey: user?.apiKey || null
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
