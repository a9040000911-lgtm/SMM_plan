/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
/**
 * Multi-Project Isolation Tests
 * Verifies that admins can only access data belonging to their assigned projects.
 */
import { getActiveProjectId, validateProjectAccess } from '@/utils/project-resolver';
import { getAdminSession } from '@/utils/admin-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        project: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
        },
        user: {
            findMany: jest.fn(),
            update: jest.fn(),
        }
    }
}));

jest.mock('@/utils/admin-session', () => ({
    getAdminSession: jest.fn()
}));

jest.mock('next/headers', () => ({
    cookies: jest.fn()
}));

describe('Multi-Project Data Isolation', () => {
    const mockCookiesValues = new Map<string, string>();
    const mockCookieStore = {
        get: jest.fn((key: string) => ({ value: mockCookiesValues.get(key) })),
        set: jest.fn((key: string, val: string) => mockCookiesValues.set(key, val)),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockCookiesValues.clear();
        (cookies as jest.Mock).mockReturnValue(mockCookieStore);
    });

    describe('getActiveProjectId Resolution', () => {
        test('Global Admin should default to "all" if no preference set', async () => {
            (getAdminSession as jest.Mock).mockResolvedValue({
                isGlobalAdmin: true,
                role: 'ADMIN',
                allowedProjects: []
            });

            const projectId = await getActiveProjectId();
            expect(projectId).toBe('all');
        });

        test('Regular Admin should default to first allowed project', async () => {
            (getAdminSession as jest.Mock).mockResolvedValue({
                isGlobalAdmin: false,
                role: 'ADMIN',
                allowedProjects: ['project-a', 'project-b']
            });

            const projectId = await getActiveProjectId();
            expect(projectId).toBe('project-a');
        });

        test('Regular Admin should be restricted to allowed projects even if cookie differs', async () => {
            (getAdminSession as jest.Mock).mockResolvedValue({
                isGlobalAdmin: false,
                role: 'ADMIN',
                allowedProjects: ['project-a']
            });
            mockCookiesValues.set('active_project_id', 'project-B-forbidden');

            const projectId = await getActiveProjectId();
            expect(projectId).toBe('project-a'); // Should ignore forbidden cookie
        });

        test('Global Admin can switch to any valid project via cookie', async () => {
            (getAdminSession as jest.Mock).mockResolvedValue({
                isGlobalAdmin: true,
                role: 'ADMIN'
            });
            mockCookiesValues.set('active_project_id', 'project-x');
            (prisma.project.findUnique as jest.Mock).mockResolvedValue({ id: 'project-x' });

            const projectId = await getActiveProjectId();
            expect(projectId).toBe('project-x');
        });
    });

    describe('validateProjectAccess', () => {
        test('Should block access for unauthorized projects', async () => {
            (getAdminSession as jest.Mock).mockResolvedValue({
                isGlobalAdmin: false,
                allowedProjects: ['project-a']
            });

            const hasAccess = await validateProjectAccess('project-b');
            expect(hasAccess).toBe(false);
        });

        test('Should allow access for authorized projects', async () => {
            (getAdminSession as jest.Mock).mockResolvedValue({
                isGlobalAdmin: false,
                allowedProjects: ['project-a']
            });

            const hasAccess = await validateProjectAccess('project-a');
            expect(hasAccess).toBe(true);
        });

        test('Global Admin has access to anything', async () => {
            (getAdminSession as jest.Mock).mockResolvedValue({
                isGlobalAdmin: true
            });

            const hasAccess = await validateProjectAccess('random-project-id');
            expect(hasAccess).toBe(true);
        });
    });
});
