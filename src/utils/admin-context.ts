/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { AdminContext } from '@/services/types';
import { getAdminSession } from './admin-session';

/**
 * Server-side utility to convert the current admin session into a standardized AdminContext
 * suitable for service layer consumption.
 */
export async function getAdminContext(): Promise<AdminContext> {
    const session = await getAdminSession();
    if (!session) throw new Error('Unauthorized: No active admin session found');
    
    return {
        userId: session.id,
        role: session.role as any,
        allowedProjects: session.allowedProjects,
        isGlobalAdmin: session.isGlobalAdmin
    };
}


