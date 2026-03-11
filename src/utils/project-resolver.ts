/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { cookies } from 'next/headers';
import { getAdminSession } from './admin-session';
import { prisma } from '@/lib/prisma';

/**
 * Utility to resolve the current active project ID for an admin session.
 * It checks for a cookie preference, verifies access, and falls back to default.
 */
export async function getActiveProjectId(): Promise<string | null> {
    const session = await getAdminSession();
    if (!session) return null;

    const cookieStore = await cookies();
    const preferredId = cookieStore.get('active_project_id')?.value;

    // 1. If global admin, they can access anything. Use preference or fall back to 'all'.
    if (session.isGlobalAdmin) {
        if (preferredId === 'all') return 'all';
        if (preferredId) {
            // Validate project exists if preferredId is not 'all'
            const project = await prisma.project.findUnique({ where: { id: preferredId }, select: { id: true } });
            if (project) return project.id;
        }

        // Default to 'all' for Super Admins
        return 'all';
    }

    // 2. For regular admins, check allowedProjects list
    if (!session.allowedProjects || session.allowedProjects.length === 0) return null;

    // Use preferred ID if it's in the allowed list
    if (preferredId && session.allowedProjects.includes(preferredId)) {
        return preferredId;
    }

    // Fallback to the first allowed project
    return session.allowedProjects[0];
}

/**
 * Ensures the project ID is valid and accessible by the current user.
 * Useful for validating API inputs.
 */
export async function validateProjectAccess(projectId: string): Promise<boolean> {
    const session = await getAdminSession();
    if (!session) return false;

    if (session.isGlobalAdmin) return true;

    return session.allowedProjects.includes(projectId);
}

/**
 * Resolves the project ID for public/client components (Server Side).
 * Priority: 
 * 1. Admin active project (if admin is viewing/testing)
 * 2. Hostname match (for multi-tenant production)
 * 3. Default project (first in DB)
 */
export async function getClientProjectId(): Promise<string | null> {
    // 1. Check if admin session is active and has a selected project
    try {
        const adminSelectedId = await getActiveProjectId();
        if (adminSelectedId && adminSelectedId !== 'all') {
            return adminSelectedId;
        }
    } catch { /* ignore if headers/session not available in current context */ }

    // 2. Hostname resolution (Server Component only)
    try {
        const { headers } = await import('next/headers');
        const headersList = await headers();
        const host = headersList.get('host');

        if (host) {
            const cleanHost = host.split(':')[0].toLowerCase();
            const project = await prisma.project.findFirst({
                where: {
                    OR: [
                        { domain: cleanHost },
                        { slug: cleanHost }
                    ]
                },
                select: { id: true }
            });
            if (project) return project.id;
        }
    } catch { /* ignore */ }

    // 3. Last fallback: default project
    const defaultProject = await prisma.project.findFirst({
        orderBy: { createdAt: 'asc' }
    });
    return defaultProject?.id || null;
}
