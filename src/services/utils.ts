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

        const logData = {
            adminId: ctx.userId,
            action: actionName,
            targetId: projectId || 'SYSTEM',
            details: 'OK',
            metadata: {
                timestamp: new Date().toISOString(),
                success: true
            }
        };

        // Fire-and-forget: логируем успешное действие в аудит-лог
        prisma.adminLog.create({
            data: logData
        }).catch((logErr: any) => {
            if (logErr && logErr.code === 'P2003') {
                // FK violation (e.g. user was deleted but session exists, or dev mock token)
                logData.adminId = null as any;
                (logData.metadata as any).originalUserId = ctx.userId;
                return prisma.adminLog.create({ data: logData }).catch(e => 
                    console.error('[AuditLog] Failed on P2003 retry:', e)
                );
            }
            console.error('[AuditLog] Failed to log success:', logErr);
        });

        return { success: true, data: result };
    } catch (error: any) {
        console.error(`[AdminServiceError] ${actionName}:`, error);

        // Логируем критический сбой в базу для аудита
        try {
            const errLogData = {
                adminId: ctx.userId,
                action: `ERROR_${actionName}`,
                targetId: projectId || 'SYSTEM',
                details: error.message || 'Unknown error',
                metadata: {
                    stack: error.stack,
                    timestamp: new Date().toISOString()
                }
            };
            await prisma.adminLog.create({ data: errLogData }).catch(async (errLogErr: any) => {
                 if (errLogErr && errLogErr.code === 'P2003') {
                      errLogData.adminId = null as any;
                      (errLogData.metadata as any).originalUserId = ctx.userId;
                      await prisma.adminLog.create({ data: errLogData });
                 } else {
                     throw errLogErr;
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


