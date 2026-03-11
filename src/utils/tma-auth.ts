/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { TelegramAuth, TMAInitData } from '@/lib/telegram/auth';
import { prisma } from '@/lib/prisma';
import { CryptoService } from '@/services/core';
import type { NextRequest } from 'next/server';

export async function validateProjectTMAData(req: NextRequest): Promise<{ isValid: boolean, data?: TMAInitData, error?: string, project?: any }> {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('tma ')) {
        return { isValid: false, error: 'Authorization header missing or invalid' };
    }

    const initData = authHeader.split('tma ')[1];

    // Resolve project based on Host
    const host = req.headers.get('host') || '';
    const domain = host.split(':')[0]; // e.g. smmplan.com

    // Check if the domain matches any project
    let project = await prisma.project.findFirst({
        where: { domain: domain }
    });

    // Fallback to default project if domain not found
    if (!project) {
        project = await prisma.project.findFirst({
            where: { slug: 'default' }
        });
    }

    if (!project || !project.botToken) {
        return { isValid: false, error: 'Project bot token not found' };
    }

    try {
        const decryptedToken = CryptoService.decrypt(project.botToken);
        const auth = TelegramAuth.validateTMAData(initData, decryptedToken);

        return {
            ...auth,
            project: project
        };
    } catch (e: any) {
        return { isValid: false, error: 'Token decryption failed: ' + e.message };
    }
}
