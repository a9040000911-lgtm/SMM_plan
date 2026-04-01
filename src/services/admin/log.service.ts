/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';

export class LogService {
    /**
     * Logs an admin action to the database with optional data diff.
     */
    static async log(
        adminId: string, 
        action: string, 
        targetId: string | null = null, 
        details: string = '',
        oldValue: any = null,
        newValue: any = null
    ) {
        try {
            await prisma.adminLog.create({
                data: {
                    adminId: adminId,
                    action,
                    targetId,
                    details,
                    metadata: oldValue || newValue ? {
                        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : undefined,
                        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : undefined
                    } : undefined
                }
            });
        } catch (err) {
            console.error('[LogService] Failed to create admin log:', err);
        }
    }

    /**
     * Common actions constants
     */
    static ACTIONS = {
        ADJUST_BALANCE: 'ADJUST_BALANCE',
        UPDATE_USER: 'UPDATE_USER',
        CREATE_USER: 'CREATE_USER',
        ARCHIVE_USER: 'ARCHIVE_USER',
        UPDATE_PROVIDER: 'UPDATE_PROVIDER',
        ADD_PROVIDER_FUNDS: 'ADD_PROVIDER_FUNDS',
        UPDATE_STAFF_ACCESS: 'UPDATE_STAFF_ACCESS',
        UPDATE_PROJECT: 'UPDATE_PROJECT',
        LOGIN: 'LOGIN'
    };
}


