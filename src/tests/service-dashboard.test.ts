/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
/**
 * @jest-environment node
 */
import { getServiceCategoriesAction, updateService } from '@/app/admin/services/actions';
import { bulkMoveServicesToCategoryAction } from '@/app/admin/services/bulk-actions';
import { prisma } from '@/lib/prisma';
import { getActiveProjectId } from '@/utils/admin-session';
import { getAdminSession } from '@/utils/admin-session';

// Mock dependencies
jest.mock('@/lib/prisma', () => {
    const mockPrisma: any = {
        serviceCategory: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
        },
        internalService: {
            updateMany: jest.fn(),
            update: jest.fn(),
            findUnique: jest.fn(),
        },
                settings: { findUnique: jest.fn(), findFirst: jest.fn(), upsert: jest.fn(), update: jest.fn(), create: jest.fn() },
        globalSetting: { findUnique: jest.fn(), findFirst: jest.fn(), upsert: jest.fn() },
        $transaction: jest.fn((fn) => fn(mockPrisma)),
        serviceChangeLog: {
            create: jest.fn(),
        }
    };
    return { prisma: mockPrisma };
});

jest.mock('@/utils/admin-session', () => ({
    getAdminSession: jest.fn(),
    getActiveProjectId: jest.fn(),
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

describe('Service Dashboard Enhanced Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (getAdminSession as jest.Mock).mockResolvedValue({ role: 'ADMIN', id: 'admin-id', isGlobalAdmin: true });
    });

    describe('getServiceCategoriesAction', () => {
        test('should fetch global categories when projectId is "all"', async () => {
            (getActiveProjectId as jest.Mock).mockResolvedValue('all');
            (prisma.serviceCategory.findMany as jest.Mock).mockResolvedValue([]);

            await getServiceCategoriesAction();

            expect(prisma.serviceCategory.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: { projectId: null }
            }));
        });

        test('should fetch project categories for valid UUID', async () => {
            const pid = 'test-uuid';
            (getActiveProjectId as jest.Mock).mockResolvedValue(pid);
            (prisma.serviceCategory.findMany as jest.Mock).mockResolvedValue([]);

            await getServiceCategoriesAction();

            expect(prisma.serviceCategory.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: { projectId: pid }
            }));
        });
    });

    describe('bulkMoveServicesToCategoryAction', () => {
        test('should execute updateMany with correct data', async () => {
            const ids = ['1', '2'];
            await bulkMoveServicesToCategoryAction(ids, 'cat-id', 'VK', 'LIKES');

            expect(prisma.internalService.updateMany).toHaveBeenCalledWith({
                where: { id: { in: ids } },
                data: {
                    categoryId: 'cat-id',
                    platform: 'VK',
                    category: 'LIKES'
                }
            });
        });
    });

    describe('updateService RBAC', () => {
        test('SEO role can update service content', async () => {
            (getAdminSession as jest.Mock).mockResolvedValue({ role: 'SEO', id: 'seo-id' });
            (prisma.internalService.findUnique as jest.Mock).mockResolvedValue({ id: 's-1', pricePer1000: 10 });
            (prisma.internalService.update as jest.Mock).mockResolvedValue({});

            const res = await updateService('s-1', { name: 'SEO Optimized Name' });
            expect(res.success).toBe(true);
        });

        test('SEO role cannot update price (silently filtered)', async () => {
            (getAdminSession as jest.Mock).mockResolvedValue({ role: 'SEO', id: 'seo-id' });
            (prisma.internalService.findUnique as jest.Mock).mockResolvedValue({ id: 's-1', pricePer1000: 10 });
            (prisma.internalService.update as jest.Mock).mockResolvedValue({});

            await updateService('s-1', { pricePer1000: 999 });
            
            // Should call update but WITHOUT pricePer1000 in data
            expect(prisma.internalService.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.not.objectContaining({ pricePer1000: expect.anything() })
            }));
        });

        test('SUPPORT role can update service content', async () => {
            (getAdminSession as jest.Mock).mockResolvedValue({ role: 'SUPPORT', id: 'support-id' });
            (prisma.internalService.findUnique as jest.Mock).mockResolvedValue({ id: 's-1', pricePer1000: 10 });
            (prisma.internalService.update as jest.Mock).mockResolvedValue({});

            const res = await updateService('s-1', { name: 'New Name' });
            expect(res.success).toBe(true);
        });
    });
});


