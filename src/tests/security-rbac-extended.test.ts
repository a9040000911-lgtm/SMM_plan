/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
/**
 * Extended Security RBAC Tests
 * Focuses on privilege escalation and Support role restrictions
 */
import { createUserAction, changeRoleAction, adjustBalanceAction } from '@/app/admin/users/actions';
import { getAdminSession } from '@/utils/admin-session';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        ledgerEntry: {
            create: jest.fn(),
        },
                settings: { findUnique: jest.fn(), findFirst: jest.fn(), upsert: jest.fn(), update: jest.fn(), create: jest.fn() },
        globalSetting: { findUnique: jest.fn(), findFirst: jest.fn(), upsert: jest.fn() },
        $transaction: jest.fn((cb) => cb({
            user: { update: jest.fn() },
            ledgerEntry: { create: jest.fn() }
        })),
    }
}));

jest.mock('@/utils/admin-session', () => ({
    getAdminSession: jest.fn()
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn()
}));

jest.mock('next/navigation', () => ({
    redirect: jest.fn()
}));

describe('Security: Extended RBAC & Privilege Escalation', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Privilege Escalation: Non-Global ADMIN', () => {
        test('Non-global ADMIN should NOT be able to create another ADMIN', async () => {
            // Mock session as regular ADMIN (not global)
            (getAdminSession as jest.Mock).mockResolvedValue({
                role: 'ADMIN',
                isGlobalAdmin: false,
                id: 'admin-id'
            });

            const formData = new FormData();
            formData.append('username', 'new_admin');
            formData.append('role', 'ADMIN');

            const result = await createUserAction({}, formData);
            expect(result.error).toBe('Только глобальный администратор может создавать других администраторов');
        });

        test('Non-global ADMIN should NOT be able to promote user to ADMIN', async () => {
            (getAdminSession as jest.Mock).mockResolvedValue({
                role: 'ADMIN',
                isGlobalAdmin: false,
                id: 'admin-id'
            });

            await expect(changeRoleAction('user-id', 'ADMIN')).rejects.toThrow('Только глобальный администратор может назначать права администратора');
        });

        test('Global ADMIN SHOULD be able to promote user to ADMIN', async () => {
            (getAdminSession as jest.Mock).mockResolvedValue({
                role: 'ADMIN',
                isGlobalAdmin: true,
                id: 'super-admin-id'
            });

            const res = await changeRoleAction('user-id', 'ADMIN');
            expect(res.success).toBe(true);
        });
    });

    describe('Support Role Restrictions', () => {
        test('SUPPORT should NOT be able to adjust balances', async () => {
            (getAdminSession as jest.Mock).mockResolvedValue({
                role: 'SUPPORT',
                isGlobalAdmin: false,
                id: 'support-id'
            });

            await expect(adjustBalanceAction('user-id', 100, 'Test')).rejects.toThrow('Unauthorized');
        });

        test('SUPPORT should NOT be able to change user roles', async () => {
            (getAdminSession as jest.Mock).mockResolvedValue({
                role: 'SUPPORT',
                isGlobalAdmin: false,
                id: 'support-id'
            });

            await expect(changeRoleAction('user-id', 'USER')).rejects.toThrow('Unauthorized');
        });
    });
});


