'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/utils/admin-session';

export async function updateGlobalSettingsAction(settings: Record<string, string>) {
    try {
        const session = await getAdminSession();
        if (!session?.isGlobalAdmin) {
            throw new Error('Unauthorized: Global Admin access required');
        }

        const operations = Object.entries(settings).map(([key, value]) =>
            prisma.globalSetting.upsert({
                where: { key },
                update: { value },
                create: { key, value }
            })
        );

        await Promise.all(operations);

        // Log the action
        await prisma.adminLog.create({
            data: {
                adminId: session.id,
                action: 'UPDATE_GLOBAL_SETTINGS',
                details: `Обновлены глобальные настройки: ${Object.keys(settings).join(', ')}`
            }
        });

        revalidatePath('/admin/settings');
        return { success: true };
    } catch (e: any) {
        console.error('[GlobalSettings] Error updating settings:', e);
        return { success: false, error: e.message };
    }
}

export async function getGlobalSettingsAction() {
    try {
        const settings = await prisma.globalSetting.findMany();
        const map: Record<string, string> = {};
        settings.forEach(s => map[s.key] = s.value);
        return { success: true, settings: map };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
