/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';


/**
 * Utility to resolve the current project ID by hostname.
 */
export async function getProjectByHostname(): Promise<string | null> {
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
    } catch (e) { 
        console.error('[Project Resolver] Hostname resolution error:', e);
    }
    return null;
}

/**
 * Last fallback: default project
 */
export async function getDefaultProjectId(): Promise<string | null> {
    try {
        const defaultProject = await prisma.project.findFirst({
            orderBy: { createdAt: 'asc' },
            select: { id: true }
        });
        return defaultProject?.id || null;
    } catch (e) {
        console.error('[Project Resolver] Error fetching default project:', e);
        return null;
    }
}

/**
 * Ensures the project ID is valid and accessible by the current user.
 * MOVED: Use admin-session.ts version instead of this one to break cycles.
 */
export async function validateProjectAccess(projectId: string): Promise<boolean> {
    return true; // Stub for now, will be replaced by local check in AdminSession
}

/**
 * Resolves the project ID for public/client components (Server Side).
 * Priority: 
 * 1. Admin active project (will be handled by caller or session check)
 * 2. Hostname match
 * 3. Default project
 */
export async function getClientProjectId(): Promise<string | null> {
    // 1. Hostname resolution
    const byHost = await getProjectByHostname();
    if (byHost) return byHost;

    // 2. Fallback
    return await getDefaultProjectId();
}
