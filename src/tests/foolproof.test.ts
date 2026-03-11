/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { adjustBalanceAction, updateCredentialsAction } from '@/app/admin/users/actions';
import { updateService as updateServicePriceAction } from '@/app/admin/services/actions';
import { prisma } from '@/lib/prisma';

// Mock Next.js headers and cache
const mockCookies = {
  get: jest.fn()
};

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => mockCookies)
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}));

jest.mock('@/utils/admin-session', () => ({
  getAdminSession: jest.fn()
}));

import { getAdminSession } from '@/utils/admin-session';

describe('Foolproof Business Logic Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock as Admin
    (getAdminSession as jest.Mock).mockResolvedValue({
      role: 'ADMIN',
      id: 'admin-id',
      isGlobalAdmin: false,
      allowedProjects: []
    });
  });

  // --- ТЕСТ 1: ВАЛИДАЦИЯ ЦЕНЫ ---
  test('Should reject negative price per 1000', async () => {
    try {
      await updateServicePriceAction('any-id', { pricePer1000: -50 });
      throw new Error('FAILED_TO_CATCH');
    } catch (e: any) {
      console.log('DEBUG_FOOLPROOF_ERROR:', e.name, JSON.stringify(e.errors));
      const isZod = e.name === 'ZodError' || (e.errors && Array.isArray(e.errors));
      expect(isZod).toBe(true);
      expect(e.errors[0].message).toBe('Price must be positive');
    }
  });

  // --- ТЕСТ 2: ВАЛИДАЦИЯ БАЛАНСА ---
  test('Should reject zero balance adjustment', async () => {
    try {
      await adjustBalanceAction('user-id', 0, 'Support test');
      throw new Error('FAILED_TO_CATCH');
    } catch (e: any) {
      expect(e.message).toContain('Amount cannot be zero');
    }
  });

  // --- ТЕСТ 3: ЗАЩИТА РОЛЕЙ (SEO vs PRICE) ---
  test('SEO Manager should NOT be able to change prices', async () => {
    // Мокаем сессию как SEO
    (getAdminSession as jest.Mock).mockResolvedValue({
      role: 'SEO',
      username: 'seo_guy',
      isGlobalAdmin: false,
      id: 'seo-id',
      allowedProjects: []
    });

    // Создаем тестовую услугу в БД с ПРАВИЛЬНЫМИ данными (desc > 5 chars)
    const svcId = 'test-price-lock-' + Date.now();
    await prisma.internalService.create({
      data: {
        id: svcId,
        name: 'Test Lock Service',
        description: 'Long enough description for Zod',
        platform: 'TELEGRAM',
        category: 'VIEWS',
        pricePer1000: 500,
        geo: 'RU',
        minQty: 1,
        maxQty: 10
      }
    });

    // Пытаемся изменить цену под ролью SEO
    await updateServicePriceAction(svcId, { pricePer1000: 1, name: 'Changed Name' });

    // Проверяем, что цена в базе НЕ изменилась, а имя ИЗМЕНИЛОСЬ (так как SEO может менять контент)
    const updatedSvc = await prisma.internalService.findUnique({ where: { id: svcId } });
    expect(Number(updatedSvc?.pricePer1000)).toBe(500); // Цена НЕ изменилась
    expect(updatedSvc?.name).toBe('Changed Name'); // Имя ИЗМЕНИЛОСЬ

    // Cleanup
    await prisma.internalService.delete({ where: { id: svcId } });
  });

  // --- ТЕСТ 4: ВАЛИДАЦИЯ КРЕДЕНШЛОВ ---
  test('Should reject malformed email and short password', async () => {
    // Сначала проверим почту
    try {
      await updateCredentialsAction('user-id', { email: 'invalid-email' });
      throw new Error('FAILED_TO_CATCH');
    } catch (e: any) {
      expect(e.name).toBe('ZodError');
      expect(e.errors[0].message).toBe('Invalid email format');
    }

    // Теперь проверим пароль
    try {
      await updateCredentialsAction('user-id', { password: '123' });
      throw new Error('FAILED_TO_CATCH');
    } catch (e: any) {
      expect(e.name).toBe('ZodError');
      expect(e.errors[0].message).toBe('Password must be at least 6 characters');
    }
  });

});
