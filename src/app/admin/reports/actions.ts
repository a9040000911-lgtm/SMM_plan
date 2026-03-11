'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

async function verifyAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session) throw new Error('Unauthorized');
  const { verifyAdminSession } = await import('@/lib/jwt');
  const data = await verifyAdminSession(session.value);
  if (!data || !['ADMIN', 'SUPPORT'].includes(data.role)) throw new Error('Unauthorized');
}

/**
 * Глобальный отчет по прибыли (Profit & Loss)
 */
export async function exportProfitLossReport(startDate: string, endDate: string) {
  await verifyAdmin();
  const start = new Date(startDate);
  const end = new Date(endDate + 'T23:59:59.999Z');

  const [orders, expenses] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: start, lte: end }, status: 'COMPLETED' },
      include: { internalService: true }
    }),
    prisma.businessExpense.findMany({
      where: { date: { gte: start, lte: end } }
    })
  ]);

  const totalRevenue = orders.reduce((acc, o) => acc + o.totalPrice.toNumber(), 0);
  const totalServiceCost = orders.reduce((acc, o) => acc + (o.costPrice ? o.costPrice.toNumber() : 0), 0);
  const totalBusinessExpenses = expenses.reduce((acc, e) => acc + e.amount.toNumber(), 0);

  const grossProfit = totalRevenue - totalServiceCost;
  const netProfit = grossProfit - totalBusinessExpenses;

  const headers = ['Метрика', 'Значение (₽)'];
  const rows = [
    ['Общая выручка (Оплаты)', totalRevenue.toFixed(2)],
    ['Себестоимость услуг (Провайдеры)', totalServiceCost.toFixed(2)],
    ['Валовая прибыль (Gross Profit)', grossProfit.toFixed(2)],
    ['Операционные расходы (OPEX)', totalBusinessExpenses.toFixed(2)],
    ['Чистая прибыль (Net Profit)', netProfit.toFixed(2)],
    ['Рентабельность (%)', ((netProfit / totalRevenue) * 100).toFixed(2) + '%']
  ];

  const expensesBreakdown = expenses.map(e => [`Расход: ${e.category} (${e.description || '-'})`, e.amount.toString()]);

  return [
    headers.join(','),
    ...rows.map(r => r.join(',')),
    '',
    'ДЕТАЛИЗАЦИЯ РАСХОДОВ',
    ...expensesBreakdown.map(r => r.join(','))
  ].join('\n');
}

/**
 * Стандартные отчеты (сохранены для совместимости)
 */
export async function exportTransactionsReport(startDate: string, endDate: string) {
  await verifyAdmin();
  const txs = await prisma.transaction.findMany({
    where: { createdAt: { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59.999Z') } },
    include: { user: true },
    orderBy: { createdAt: 'asc' },
  });
  const headers = ['ID', 'Дата', 'Тип', 'Сумма', 'Статус', 'Юзер'];
  const rows = txs.map(t => [t.id, t.createdAt.toISOString(), t.type, t.amount.toString(), t.status, t.user.username || 'user']);
  return [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
}

export async function exportOrdersReport(startDate: string, endDate: string) {
  await verifyAdmin();
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59.999Z') } },
    include: { user: true, internalService: true },
    orderBy: { createdAt: 'asc' },
  });
  const headers = ['ID', 'Дата', 'Услуга', 'Продажа', 'Себестоимость', 'Прибыль', 'Статус'];
  const rows = orders.map(o => [o.id, o.createdAt.toISOString(), o.internalService.name, o.totalPrice.toString(), (o.costPrice?.toString() || '0'), (o.totalPrice.toNumber() - (o.costPrice?.toNumber() || 0)).toString(), o.status]);
  return [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
}

export async function exportUsersReport() {
  await verifyAdmin();
  const users = await prisma.user.findMany({ include: { _count: { select: { orders: true } } } });
  const headers = ['ID', 'Username', 'Email', 'Баланс', 'Траты', 'Заказов'];
  const rows = users.map(u => [u.id, u.username || '', u.email || '', u.balance.toString(), u.spent.toString(), u._count.orders.toString()]);
  return [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
}
