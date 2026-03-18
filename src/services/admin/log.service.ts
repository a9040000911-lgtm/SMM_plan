/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';

export class LogService {
    /**
     * Logs an admin action to the database.
     */
    static async log(adminId: string, action: string, targetId: string | null = null, details: string = '') {
        try {
            await prisma.adminLog.create({
                data: {
                    adminId,
                    action,
                    targetId,
                    details
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
        UPDATE_PROVIDER: 'UPDATE_PROVIDER',
        ADD_PROVIDER_FUNDS: 'ADD_PROVIDER_FUNDS',
        UPDATE_STAFF_ACCESS: 'UPDATE_STAFF_ACCESS',
        LOGIN: 'LOGIN'
    };
}


