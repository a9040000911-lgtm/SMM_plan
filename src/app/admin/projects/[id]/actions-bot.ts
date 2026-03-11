'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { CryptoService } from '@/services/core';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { verifyAdminSession } from '@/lib/jwt';

async function checkAdmin(projectId: string) {
    const cookieStore = await cookies();
    const sessionData = cookieStore.get('admin_session');
    const session = sessionData ? await verifyAdminSession(sessionData.value) : null;

    if (!session) throw new Error('Unauthorized');
    if (!session.isGlobalAdmin && !session.allowedProjects?.includes(projectId)) {
        throw new Error('Access denied');
    }
    return session;
}

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
    await checkAdmin(projectId);

    const check = await checkBotTokenAction(token);
    if (!check.ok) throw new Error(`Invalid token: ${check.error}`);

    await prisma.project.update({
        where: { id: projectId },
        data: {
            botToken: CryptoService.encrypt(token),
            botUsername: check.username
        } as any
    });

    revalidatePath(`/admin/projects/${projectId}`);
    return { ok: true, username: check.username };
}

/**
 * Сохранение конфигурации (меню, приветствие, модули)
 */
export async function saveBotFullConfigAction(projectId: string, config: any) {
    await checkAdmin(projectId);

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { config: true }
    });

    const currentConfig = (project?.config as any) || {};

    await prisma.project.update({
        where: { id: projectId },
        data: {
            config: {
                ...currentConfig,
                ...config
            }
        } as any
    });

    revalidatePath(`/admin/projects/${projectId}`);
    return { ok: true };
}

/**
 * Отключение/Удаление токена
 */
export async function removeBotTokenAction(projectId: string) {
    await checkAdmin(projectId);

    await prisma.project.update({
        where: { id: projectId },
        data: {
            botToken: null,
            botUsername: ''
        } as any
    });

    revalidatePath(`/admin/projects/${projectId}`);
    return { ok: true };
}
