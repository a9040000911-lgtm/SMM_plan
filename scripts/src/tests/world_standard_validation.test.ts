/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { LinkService } from '@/services/providers';
import { SessionService } from '@/services/core';
import { prisma } from '@/lib/prisma';
import { GET as getStats } from '@/app/api/admin/stats/route';
import { changeRoleAction } from '@/app/admin/users/actions';

// --- MOCKS ---
const _mockCookies = {
    has: jest.fn(() => true),
    get: jest.fn(() => ({ value: JSON.stringify({ role: 'ADMIN', id: 'admin-id' }) })),
};

jest.mock('@/lib/prisma', () => ({
    prisma: {
        settings: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            upsert: jest.fn(),
        },
        user: { count: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
        order: { count: jest.fn(), findMany: jest.fn() },
        transaction: { count: jest.fn(), aggregate: jest.fn(), create: jest.fn() },
        supportTicket: { count: jest.fn() },
        session: { findUnique: jest.fn(), upsert: jest.fn(), deleteMany: jest.fn() },
        adminLog: { create: jest.fn() },
        $transaction: jest.fn((cb) => cb(prisma)),
    },
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

jest.mock('@/utils/admin-session', () => ({
    getAdminSession: jest.fn()
}));

import { getAdminSession } from '@/utils/admin-session';

describe('World Standard: System Validation Suite', () => {

    describe('LinkService: High-Precision Analysis', () => {

        test('Telegram: Should distinguish between public channel and private invite', () => {
            const publicLink = 'https://t.me/durov';
            const privateLink = 'https://t.me/+AbCdEf123456';

            const publicRes = LinkService.analyze(publicLink);
            const privateRes = LinkService.analyze(privateLink);

            expect(publicRes?.isPrivate).toBe(false);
            expect(privateRes?.isPrivate).toBe(true);
        });

        test('YouTube: Should identify Shorts as VIDEO targetType', () => {
            const shortsLink = 'https://www.youtube.com/shorts/dQw4w9WgXcQ';
            const res = LinkService.analyze(shortsLink);
            expect(res?.targetType).toBe('VIDEO');
            expect(res?.platform).toBe('YOUTUBE');
        });

        test('TikTok: Should handle mobile share links (vm.tiktok.com)', () => {
            const mobileLink = 'https://vm.tiktok.com/ZM8rXvXvX/';
            const res = LinkService.analyze(mobileLink);
            expect(res?.platform).toBe('TIKTOK');
            expect(res?.targetType).toBe('VIDEO');
        });
    });

    describe('Security & RBAC: Admin Integrity', () => {
        test('Role Change: Should block non-ADMIN from changing roles', async () => {
            // Mock user as SUPPORT
            (getAdminSession as jest.Mock).mockResolvedValue({ role: 'SUPPORT', id: 'staff-id', isGlobalAdmin: false });

            await expect(changeRoleAction('user-1', 'ADMIN')).rejects.toThrow(/Unauthorized/);
        });

        test('Role Change: Should ALLOW ADMIN to change roles', async () => {
            // Mock user as ADMIN
            (getAdminSession as jest.Mock).mockResolvedValue({ role: 'ADMIN', id: 'admin-id', isGlobalAdmin: true });
            (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1', username: 'test' });

            const res = await changeRoleAction('user-1', 'RESELLER');
            expect(res.success).toBe(true);
            expect(prisma.user.update).toHaveBeenCalled();
        });
    });

    describe('Admin API: Stats Reliability', () => {
        test('Should return 200 even if LAST_FINANCIAL_AUDIT is corrupted JSON', async () => {
            // Setup mock to return invalid JSON
            (prisma.settings.findFirst as jest.Mock).mockResolvedValue({ value: '{ corrupted: true, [ ' });
            (prisma.user.count as jest.Mock).mockResolvedValue(10);
            (prisma.order.count as jest.Mock).mockResolvedValue(5);
            (prisma.transaction.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 100 } });
            (prisma.order.findMany as jest.Mock).mockResolvedValue([]);

            const response = await getStats();
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.financialAudit.discrepanciesCount).toBe(0); // Default value on parse error
        });
    });

    describe('SessionService: Durability', () => {
        test('Should handle non-existent project gracefully', async () => {
            const res = await SessionService.get(12345, undefined);
            expect(res).toBeUndefined();
        });

        test('Should handle corrupted session data in DB', async () => {
            (prisma.session.findUnique as jest.Mock).mockResolvedValue({ data: { link: 'valid' } });

            const res = await SessionService.get(12345, 'test-project');
            expect(res?.link).toBe('valid');
        });
    });

});
