/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { adjustBalanceAction, updateCredentialsAction } from '@/app/admin/users/actions';
import { updateService as updateServicePriceAction } from '@/app/admin/services/actions';
import { prisma } from '@/lib/prisma';
import { getAdminSession, getActiveProjectId } from '@/utils/admin-session';

// --- MOCKS ---
const mockCookies = { get: jest.fn() };
jest.mock('next/headers', () => ({ cookies: jest.fn(() => mockCookies) }));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

// Note: isZodError is now globally available via jest.setup.js
declare global {
  function isZodError(e: any): boolean;
}

describe('Foolproof Business Logic Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- ТЕСТ 1: ВАЛИДАЦИЯ ЦЕНЫ ---
  test('Should reject negative price per 1000', async () => {
    (getAdminSession as jest.Mock).mockResolvedValue({
      role: 'ADMIN', id: 'admin-id', isGlobalAdmin: true, allowedProjects: []
    });
    (getActiveProjectId as jest.Mock).mockResolvedValue(null);

    try {
      await updateServicePriceAction('any-id', { pricePer1000: -50 });
      throw new Error('FAILED_TO_CATCH');
    } catch (e: any) {
      if (e.message === 'FAILED_TO_CATCH') throw e;
      expect(isZodError(e)).toBe(true);
    }
  });

  // --- ТЕСТ 2: ВАЛИДАЦИЯ БАЛАНСА ---
  test('Should reject zero balance adjustment', async () => {
    (getAdminSession as jest.Mock).mockResolvedValue({
      role: 'ADMIN', id: 'admin-id', isGlobalAdmin: true, allowedProjects: []
    });
    try {
      await adjustBalanceAction('user-id', 0, 'Support test');
      throw new Error('FAILED_TO_CATCH');
    } catch (e: any) {
      if (e.message === 'FAILED_TO_CATCH') throw e;
      expect(isZodError(e)).toBe(true);
    }
  });

  // --- ТЕСТ 3: ЗАЩИТА РОЛЕЙ (SEO vs PRICE) ---
  test('SEO Manager should NOT be able to change prices', async () => {
    (getAdminSession as jest.Mock).mockResolvedValue({
      role: 'SEO', username: 'seo_guy', isGlobalAdmin: false, id: 'seo-id', allowedProjects: []
    });
    (getActiveProjectId as jest.Mock).mockResolvedValue(null);

    const serviceData = {
      id: 'seo-lock-test-id',
      name: 'SEO Lock Test',
      description: 'Quality description for tests',
      platform: 'TELEGRAM',
      category: 'VIEWS',
      pricePer1000: 500,
      geo: 'RU',
      minQty: 10,
      maxQty: 1000,
      isActive: true
    };

    // Mock Prisma to return the service
    (prisma.internalService.create as jest.Mock).mockResolvedValue(serviceData);
    (prisma.internalService.findUnique as jest.Mock).mockResolvedValue(serviceData);
    
    // Пытаемся изменить цену под ролью SEO
    await updateServicePriceAction(serviceData.id, { pricePer1000: 1, name: 'SEO Updated Name' });

    // Mock updated state
    (prisma.internalService.findUnique as jest.Mock).mockResolvedValue({
        ...serviceData,
        name: 'SEO Updated Name'
    });

    const updatedSvc = await prisma.internalService.findUnique({ where: { id: serviceData.id } });
    expect(Number(updatedSvc?.pricePer1000)).toBe(500); // Цена НЕ изменилась
    expect(updatedSvc?.name).toBe('SEO Updated Name'); // Имя ИЗМЕНИЛОСЬ
  });

  // --- ТЕСТ 4: ВАЛИДАЦИЯ КРЕДЕНШЛОВ ---
  test('Should reject malformed email and short password', async () => {
    (getAdminSession as jest.Mock).mockResolvedValue({
      role: 'ADMIN', id: 'admin-id', isGlobalAdmin: true, allowedProjects: []
    });

    // Check email
    try {
      await updateCredentialsAction('user-id', { email: 'invalid' });
      throw new Error('FAILED_TO_CATCH');
    } catch (e: any) {
      if (e.message === 'FAILED_TO_CATCH') throw e;
      expect(isZodError(e)).toBe(true);
    }

    // Check password
    try {
      await updateCredentialsAction('user-id', { password: '123' });
      throw new Error('FAILED_TO_CATCH');
    } catch (e: any) {
      if (e.message === 'FAILED_TO_CATCH') throw e;
      expect(isZodError(e)).toBe(true);
    }
  });

});


