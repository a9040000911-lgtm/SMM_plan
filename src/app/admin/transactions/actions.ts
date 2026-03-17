'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { getAdminSession } from '@/utils/admin-session';
import { AdminFinanceService } from '@/services/admin/admin-finance.service';
import { AdminContext } from '@/services/types';

async function getCtx(): Promise<AdminContext> {
  const session = await getAdminSession();
  if (!session) throw new Error('Unauthorized');
  return {
    userId: session.id,
    role: session.role as any,
    allowedProjects: session.allowedProjects,
    isGlobalAdmin: session.isGlobalAdmin
  };
}

export async function exportTransactionsCsvAction(
  params: {
    search?: string,
    type?: string,
    status?: string,
    minAmount?: string,
    maxAmount?: string,
    startDate?: string,
    endDate?: string
  }
) {
  const ctx = await getCtx();
  if (!['ADMIN', 'SUPPORT'].includes(ctx.role)) throw new Error('Unauthorized');

  const result = await AdminFinanceService.getInstance().getTransactionsForExport(ctx, params);
  if (!result.success) throw new Error(result.error.message);

  const txs = result.data;

  // Формируем CSV
  const headers = ['ID', 'Date', 'User', 'TG_ID', 'Type', 'Amount', 'Status', 'External_ID'];
  const rows = txs.map((t: any) => [
    t.id,
    t.createdAt.toISOString(),
    t.user.username || t.user.email || 'N/A',
    t.user.tgId?.toString() || '',
    t.type,
    t.amount.toString(),
    t.status,
    t.externalId || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}
