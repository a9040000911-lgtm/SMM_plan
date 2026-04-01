/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * AdminDataService — Unit Tests
 */
jest.mock('@/lib/prisma', () => ({
    prisma: {
        internalService: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
        project: { findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn() },
        adminLog: { create: jest.fn() },
        settings: { findUnique: jest.fn(), findFirst: jest.fn(), upsert: jest.fn(), update: jest.fn(), create: jest.fn() },
        globalSetting: { findUnique: jest.fn(), findFirst: jest.fn(), upsert: jest.fn() },
    },
}));
jest.mock('@/lib/logger', () => ({ createLogger: () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }) }));

import { AdminDataService } from './admin-data.service';
import { prisma } from '@/lib/prisma';

describe('AdminDataService', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('getProjects', () => {
        it('returns only allowed projects for non-global admin', async () => {
            (prisma.project.findMany as jest.Mock).mockResolvedValue([
                { id: 'proj1', name: 'Project 1' }
            ]);

            const ctx = {
                isGlobalAdmin: false,
                allowedProjects: ['proj1'],
                adminId: 'a1',
                email: 'test@a.ru',
                role: 'ADMIN',
                permissions: []
            };

            const result = await AdminDataService.getProjects(ctx as any);
            expect(result.success).toBe(true);
            expect(prisma.project.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: { in: ['proj1'] } }
            }));
        });
    });
});
