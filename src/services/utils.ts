/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { AdminContext, AdminServiceResult } from './types';
import { prisma } from '@/lib/prisma';

/**
 * Стандартизированная обертка для безопасного выполнения административных действий.
 * Автоматически логирует ВСЕ действия (успешные и неуспешные) в AdminLog для аудита.
 */
export async function safeAdminExecute<T>(
    ctx: AdminContext,
    actionName: string,
    fn: () => Promise<T>,
    projectId?: string
): Promise<AdminServiceResult<T>> {
    try {
        const result = await fn();

        // Fire-and-forget: логируем успешное действие в аудит-лог
        prisma.adminLog.create({
            data: {
                adminId: ctx.userId,
                action: actionName,
                targetId: projectId || 'SYSTEM',
                details: 'OK',
                metadata: {
                    timestamp: new Date().toISOString(),
                    success: true
                }
            }
        }).catch((logErr) => {
            console.error('[AuditLog] Failed to log success:', logErr);
        });

        return { success: true, data: result };
    } catch (error: any) {
        console.error(`[AdminServiceError] ${actionName}:`, error);

        // Логируем критический сбой в базу для аудита
        try {
            await prisma.adminLog.create({
                data: {
                    adminId: ctx.userId,
                    action: `ERROR_${actionName}`,
                    targetId: projectId || 'SYSTEM',
                    details: error.message || 'Unknown error',
                    metadata: {
                        stack: error.stack,
                        timestamp: new Date().toISOString()
                    }
                }
            });
        } catch (logError) {
            console.error('Failed to log admin error:', logError);
        }

        return {
            success: false,
            error: {
                code: actionName.toUpperCase() + '_FAILED',
                message: error.message || 'Произошла внутренняя ошибка сервера',
                details: (error.name === 'ZodError' || Array.isArray(error.issues)) ? { name: 'ZodError', issues: error.issues, message: error.message } : error
            }
        };
    }
}


