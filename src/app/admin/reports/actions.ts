'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { getAdminSession } from '@/utils/admin-session';
import { AdminDataService } from '@/services/admin/admin-data.service';
import { AdminContext } from '@/services/types';

async function getCtx(): Promise<AdminContext> {
    const session = await getAdminSession();
    if (!session || !['ADMIN', 'SUPPORT'].includes(session.role)) throw new Error('Unauthorized');
    return {
        userId: session.id,
        role: session.role as any,
        allowedProjects: session.allowedProjects,
        isGlobalAdmin: session.isGlobalAdmin
    };
}

/**
 * Глобальный отчет по прибыли (Profit & Loss)
 */
export async function exportProfitLossReport(startDate: string, endDate: string) {
  const ctx = await getCtx();
  const start = new Date(startDate);
  const end = new Date(endDate + 'T23:59:59.999Z');

  const result = await AdminDataService.getProfitLossData(ctx, start, end);
  if (!result.success) throw new Error(result.error.message);

  const { orders, expenses } = result.data;

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
  const ctx = await getCtx();

  const result = await AdminDataService.getTransactionsForExport(ctx, { startDate, endDate });
  if (!result.success) throw new Error(result.error.message);

  const txs = result.data;
  const headers = ['ID', 'Дата', 'Тип', 'Сумма', 'Статус', 'Юзер'];
  const rows = txs.map(t => [t.id, t.createdAt.toISOString(), t.type, t.amount.toString(), t.status, t.user.username || 'user']);
  return [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
}

export async function exportOrdersReport(startDate: string, endDate: string) {
  const ctx = await getCtx();
  const start = new Date(startDate);
  const end = new Date(endDate + 'T23:59:59.999Z');

  const result = await AdminDataService.getOrdersReportData(ctx, start, end);
  if (!result.success) throw new Error(result.error.message);

  const orders = result.data;
  const headers = ['ID', 'Дата', 'Услуга', 'Продажа', 'Себестоимость', 'Прибыль', 'Статус'];
  const rows = orders.map(o => [o.id, o.createdAt.toISOString(), o.internalService.name, o.totalPrice.toString(), (o.costPrice?.toString() || '0'), (o.totalPrice.toNumber() - (o.costPrice?.toNumber() || 0)).toString(), o.status]);
  return [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
}

export async function exportUsersReport() {
  const ctx = await getCtx();
  const result = await AdminDataService.getUsersReportData(ctx);
  if (!result.success) throw new Error(result.error.message);

  const users = result.data;
  const headers = ['ID', 'Username', 'Email', 'Баланс', 'Траты', 'Заказов'];
  const rows = users.map(u => [u.id, u.username || '', u.email || '', u.balance.toString(), u.spent.toString(), u._count.orders.toString()]);
  return [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
}
