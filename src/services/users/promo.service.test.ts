/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { PromoService } from '@/services/users';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    promoCode: { findUnique: jest.fn(), findFirst: jest.fn() },
    userPromo: { count: jest.fn(), create: jest.fn(), findFirst: jest.fn() },
    transaction: { count: jest.fn() },
    user: { findUnique: jest.fn(), update: jest.fn() }
  }
}));

describe('Promo Service', () => {
  test('should validate existing active promo', async () => {
    (prisma.promoCode.findFirst as jest.Mock).mockResolvedValue({ code: 'TEST', isActive: true });
    (prisma.userPromo.count as jest.Mock).mockResolvedValue(0);

    const res = await PromoService.validatePromo('TEST', 'user-1');
    expect(res.valid).toBe(true);
  });

  test('should fail if promo already used by user', async () => {
    (prisma.promoCode.findFirst as jest.Mock).mockResolvedValue({ code: 'TEST', isActive: true });
    (prisma.userPromo.count as jest.Mock).mockResolvedValue(1);

    const res = await PromoService.validatePromo('TEST', 'user-1');
    expect(res.valid).toBe(false);
    expect(res.error).toBe('Уже использован');
  });
});
