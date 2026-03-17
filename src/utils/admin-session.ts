/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { cookies } from 'next/headers';
import { cache } from 'react';
import { verifyAdminSession } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
// auth will be imported dynamically

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
 * Server-side utility to get the current admin session.
 * Memoized via React.cache to avoid redundant checks in a single request.
 */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
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
        const { auth } = await import("@/auth");
        const nextAuth = await auth();
        if (nextAuth?.user) {
            const user = nextAuth.user as any;
            const normalizedRole = (user.role || 'USER').toUpperCase();
            return {
                id: user.id,
                tgId: user.tgId?.toString() || null,
                role: normalizedRole,
                username: nextAuth.user.name || nextAuth.user.email || 'Admin',
                isGlobalAdmin: normalizedRole === 'ADMIN' || !!user.isGlobalAdmin,
                allowedProjects: user.allowedProjects || [],
                permissions: user.allowedTabs || []
            };
        }

        return null;
    } catch (e) {
        console.error('[AdminSession] Error retrieving session:', e);
        return null;
    }
});

/**
 * Utility to resolve the current active project ID for an admin session.
 */
export async function getActiveProjectId(): Promise<string | null> {
    const session = await getAdminSession();
    if (!session) return null;

    const cookieStore = await cookies();
    const preferredId = cookieStore.get('active_project_id')?.value;

    if (session.isGlobalAdmin) {
        if (preferredId === 'all') return 'all';
        if (preferredId) {
            const project = await prisma.project.findUnique({ where: { id: preferredId }, select: { id: true } });
            if (project) return project.id;
        }
        return 'all';
    }

    if (!session.allowedProjects || session.allowedProjects.length === 0) return null;

    if (preferredId && session.allowedProjects.includes(preferredId)) {
        return preferredId;
    }

    return session.allowedProjects[0];
}

/**
 * Validates if the current admin has access to a specific project.
 */
export async function validateProjectAccess(projectId: string): Promise<boolean> {
    const session = await getAdminSession();
    if (!session) return false;
    if (session.isGlobalAdmin) return true;
    return session.allowedProjects.includes(projectId);
}
