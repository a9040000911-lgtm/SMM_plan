/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
/**
 * Multi-Project Isolation Tests
 * Verifies that admins can only access data belonging to their assigned projects.
 */
import { getActiveProjectId, validateProjectAccess } from '@/utils/admin-session';
import { cookies } from 'next/headers';
import { verifyAdminSession } from '@/services/core/jwt';

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
        },
        settings: { findUnique: jest.fn(), findFirst: jest.fn(), upsert: jest.fn(), update: jest.fn(), create: jest.fn() },
        globalSetting: { findUnique: jest.fn(), findFirst: jest.fn(), upsert: jest.fn() },
    }
}));

jest.mock('@/services/core/jwt', () => ({
    verifyAdminSession: jest.fn(),
}));

jest.mock('next/headers', () => ({
    cookies: jest.fn()
}));

jest.mock('@/auth', () => ({
    auth: jest.fn(),
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
            mockCookiesValues.set('admin_session', 'valid-token');
            (verifyAdminSession as jest.Mock).mockResolvedValue({
                isGlobalAdmin: true,
                role: 'ADMIN',
                allowedProjects: []
            });

            const projectId = await getActiveProjectId();
            expect(projectId).toBe('all');
        });

        test('Regular Admin should default to first allowed project', async () => {
            mockCookiesValues.set('admin_session', 'valid-token');
            (verifyAdminSession as jest.Mock).mockResolvedValue({
                isGlobalAdmin: false,
                role: 'ADMIN',
                allowedProjects: ['project-a', 'project-b']
            });

            const projectId = await getActiveProjectId();
            expect(projectId).toBe('project-a');
        });
    });

    describe('validateProjectAccess', () => {
        test('Should block access for unauthorized projects', async () => {
            mockCookiesValues.set('admin_session', 'valid-token');
            (verifyAdminSession as jest.Mock).mockResolvedValue({
                id: 'admin-id',
                role: 'ADMIN',
                username: 'admin',
                isGlobalAdmin: false,
                allowedProjects: ['project-a']
            });

            const hasAccess = await validateProjectAccess('project-b');
            expect(hasAccess).toBe(false);
        });

        test('Should allow access for authorized projects', async () => {
            mockCookiesValues.set('admin_session', 'valid-token');
            (verifyAdminSession as jest.Mock).mockResolvedValue({
                id: 'admin-id',
                role: 'ADMIN',
                username: 'admin',
                isGlobalAdmin: false,
                allowedProjects: ['project-a']
            });

            const hasAccess = await validateProjectAccess('project-a');
            expect(hasAccess).toBe(true);
        });
    });
});


