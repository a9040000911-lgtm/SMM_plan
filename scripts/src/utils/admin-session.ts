/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { cookies } from 'next/headers';

export interface AdminSession {
    id: string;
    tgId: string | null;
    role: string;
    username: string;
    isGlobalAdmin: boolean;
    allowedProjects: string[];
    permissions?: string[]; // permissions can be missing in old sessions
}

/**
 * Server-side utility to get the current admin session from the custom cookie
 */
import { verifyAdminSession } from '@/lib/jwt';
import { auth } from "@/auth";


/**
 * Server-side utility to get the current admin session from the custom cookie
 */
export async function getAdminSession(): Promise<AdminSession | null> {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('admin_session');

        // 1. Try custom admin session first
        if (sessionCookie?.value) {
            const adminSession = await verifyAdminSession(sessionCookie.value);
            if (adminSession) {
                return {
                    ...adminSession,
                    role: adminSession.role.toUpperCase()
                };
            }
        }

        // 2. Fallback to NextAuth session
        const nextAuth = await auth();
        if (nextAuth?.user) {
            const user = nextAuth.user as any;
            return {
                id: user.id,
                tgId: user.tgId?.toString() || null,
                role: (user.role || 'USER').toUpperCase(),
                username: nextAuth.user.name || nextAuth.user.email || 'Admin',
                isGlobalAdmin: (user.role || '').toUpperCase() === 'ADMIN' || !!user.isGlobalAdmin,
                allowedProjects: user.allowedProjects || [],
                permissions: user.allowedTabs || []
            };
        }

        return null;
    } catch (e) {
        console.error('[AdminSession] Error retrieving session:', e);
        return null;
    }
}
