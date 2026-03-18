/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { handleRefund } from '@/services/orders';

describe('Financial Safety: Double Refund Protection', () => {
  let testUser: any;
  let testOrder: any;

  beforeAll(async () => {
    // Создаем проект
    await prisma.project.upsert({
      where: { slug: 'test-project' },
      update: {},
      create: {
        id: 'test-project',
        slug: 'test-project',
        domain: 'test-project.local',
        name: 'Test Project'
      }
    });

    // Создаем тестового пользователя
    testUser = await prisma.user.create({
      data: {
        projectId: 'test-project',
        username: 'refund_test_user',
        tgId: BigInt(Date.now()),
        balance: 0,
        spent: 1000
      }
    });

    // Создаем тестовую услугу (нужна для связи)
    const svcId = 'test-refund-svc';
    await prisma.internalService.upsert({
        where: { id: svcId },
        update: {},
        create: {
            id: svcId, name: 'Refund Test', description: 'desc', platform: 'TELEGRAM', 
            category: 'VIEWS', pricePer1000: 1000, geo: 'RU', minQty: 1, maxQty: 100
        }
    });

    // Создаем заказ на 1000 руб
    testOrder = await prisma.order.create({
      data: {
        userId: testUser.id,
        internalServiceId: svcId,
        link: 'https://test.com',
        quantity: 1000,
        totalPrice: 1000,
        status: 'PROCESSING'
      }
    });
  });

  afterAll(async () => {
    await prisma.ledgerEntry.deleteMany({ where: { userId: testUser.id } });
    await prisma.transaction.deleteMany({ where: { userId: testUser.id } });
    await prisma.order.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
  });

  test('Should NOT allow refunding more than the total price (Sequential)', async () => {
    // 1. Первый возврат (отмена заказа - полный возврат 1000 руб)
    await handleRefund(testOrder, 'CANCELED', 0);
    
    let user = await prisma.user.findUnique({ where: { id: testUser.id } });
    let order = await prisma.order.findUnique({ where: { id: testOrder.id } });
    
    expect(Number(user?.balance)).toBe(1000);
    expect(Number(order?.refundedAmount)).toBe(1000);

    // 2. Вторая попытка возврата (имитация ошибки или повторного нажатия)
    await handleRefund(testOrder, 'CANCELED', 0);

    user = await prisma.user.findUnique({ where: { id: testUser.id } });
    order = await prisma.order.findUnique({ where: { id: testOrder.id } });

    // Проверяем, что баланс остался 1000, а не стал 2000
    expect(Number(user?.balance)).toBe(1000);
    expect(Number(order?.refundedAmount)).toBe(1000);
  });

  test('Should handle cumulative partial refunds correctly and cap at total price', async () => {
    // Создаем новый заказ для теста частей
    const partialOrder = await prisma.order.create({
        data: {
          userId: testUser.id,
          internalServiceId: 'test-refund-svc',
          link: 'https://test-partial.com',
          quantity: 1000,
          totalPrice: 500,
          status: 'PROCESSING'
        }
    });

    // 1. Возвращаем 200 руб (остаток 400 из 1000 единиц)
    // Формула в коде: totalPrice * rem / quantity => 500 * 400 / 1000 = 200 руб
    await handleRefund(partialOrder, 'PARTIAL', 400);

    let user = await prisma.user.findUnique({ where: { id: testUser.id } });
    expect(Number(user?.balance)).toBe(1200); // 1000 (с прошлого теста) + 200

    // 2. Пытаемся вернуть еще 400 руб (остаток 800) -> Всего было бы 600, но лимит 500
    await handleRefund(partialOrder, 'PARTIAL', 800);

    user = await prisma.user.findUnique({ where: { id: testUser.id } });
    const order = await prisma.order.findUnique({ where: { id: partialOrder.id } });

    // Должно было добавиться только 300 руб (чтобы в сумме стало 500)
    expect(Number(order?.refundedAmount)).toBe(500); 
    expect(Number(user?.balance)).toBe(1500); // 1200 + 300
  });
});


