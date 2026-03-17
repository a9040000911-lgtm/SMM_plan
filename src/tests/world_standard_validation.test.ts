/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

// Mock everything before imports
jest.mock('@/generated/client', () => ({
    Platform: { TELEGRAM: 'TELEGRAM' },
    Category: { VIEWS: 'VIEWS' },
    Currency: { RUB: 'RUB' },
    Role: { ADMIN: 'ADMIN' },
    OrderStatus: { PENDING: 'PENDING' }
}));

jest.mock('@/utils/admin-session', () => ({
    getAdminSession: jest.fn().mockResolvedValue({
        id: 'admin-1',
        role: 'ADMIN',
        allowedProjects: [],
        isGlobalAdmin: true
    })
}));

jest.mock('@/services/admin/admin-data.service', () => ({
    AdminDataService: {
        getGlobalStats: jest.fn()
    }
}));

import { GET } from '@/app/api/admin/stats/route';
import { AdminDataService } from '@/services/admin/admin-data.service';
import { NextRequest } from 'next/server';

describe('World Standard Validation (Admin Stats)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Should return 500 when statistics fetch fails', async () => {
        // Correct implementation mapping to route.ts: 
        // if (!result.success) return 500
        (AdminDataService.getGlobalStats as jest.Mock).mockResolvedValue({
            success: false,
            error: { message: 'Failed to fetch administrator statistics' }
        });

        const response = await GET();
        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data.error).toBe('Failed to fetch administrator statistics');
    });

    test('Should return 200 when statistics fetch succeeds', async () => {
        (AdminDataService.getGlobalStats as jest.Mock).mockResolvedValue({
            success: true,
            data: { test: true }
        });

        const response = await GET();
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.test).toBe(true);
    });
});
