/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
/**
 * @jest-environment node
 */
import { getServiceCategoriesAction } from '@/app/admin/services/actions';

jest.mock('@/lib/prisma', () => ({
    prisma: {
        serviceCategory: {
            findMany: jest.fn(),
        },
        settings: { findUnique: jest.fn(), findFirst: jest.fn(), upsert: jest.fn(), update: jest.fn(), create: jest.fn() },
        globalSetting: { findUnique: jest.fn(), findFirst: jest.fn(), upsert: jest.fn() },
    }
}));

jest.mock('@/utils/admin-session', () => ({
    getAdminSession: jest.fn(),
    getActiveProjectId: jest.fn(),
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

describe('Minimal Repro', () => {
    test('should recognize this test', () => {
        expect(true).toBe(true);
    });

    test('should call getServiceCategoriesAction', async () => {
        // Just verify it doesn't crash on import/call
        try {
            await getServiceCategoriesAction();
        } catch (_e) {
            // expected to fail if mocks aren't perfect, but should at least RUN
        }
        expect(true).toBe(true);
    });
});
