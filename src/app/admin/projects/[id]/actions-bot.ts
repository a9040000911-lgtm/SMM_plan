'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { AdminDataService } from '@/services/admin/admin-data.service';
import { revalidatePath } from 'next/cache';
import { getAdminContext } from '@/utils/admin-context';

/**
 * Проверка токена через API Telegram
 */
export async function checkBotTokenAction(token: string) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        const data = await response.json();

        if (data.ok) {
            return {
                ok: true,
                username: data.result.username,
                firstName: data.result.first_name
            };
        }
        return { ok: false, error: data.description };
    } catch (e: any) {
        return { ok: false, error: e.message };
    }
}

/**
 * Обновление токена и базовой айдентики бота
 */
export async function updateBotIdentityAction(projectId: string, token: string) {
    try {
        const ctx = await getAdminContext();
        const check = await checkBotTokenAction(token);
        if (!check.ok) throw new Error(`Invalid token: ${check.error}`);

        const res = await AdminDataService.updateProjectBotSettings(ctx, projectId, {
            token,
            username: check.username
        });
        if (!res.success) throw new Error(res.error?.message);

        revalidatePath(`/admin/projects/${projectId}`);
        return { ok: true, username: check.username };
    } catch (e: any) {
        return { ok: false, error: e.message };
    }
}

/**
 * Сохранение конфигурации (меню, приветствие, модули)
 */
export async function saveBotFullConfigAction(projectId: string, config: any) {
    try {
        const ctx = await getAdminContext();
        const res = await AdminDataService.updateProjectBotSettings(ctx, projectId, { config });
        if (!res.success) throw new Error(res.error?.message);

        revalidatePath(`/admin/projects/${projectId}`);
        return { ok: true };
    } catch (e: any) {
        return { ok: false, error: e.message };
    }
}

/**
 * Отключение/Удаление токена
 */
export async function removeBotTokenAction(projectId: string) {
    try {
        const ctx = await getAdminContext();
        const res = await AdminDataService.removeProjectBotToken(ctx, projectId);
        if (!res.success) throw new Error(res.error?.message);

        revalidatePath(`/admin/projects/${projectId}`);
        return { ok: true };
    } catch (e: any) {
        return { ok: false, error: e.message };
    }
}
