'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

async function getAdminRole() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session) return null;
  try {
    const { verifyAdminSession } = await import('@/lib/jwt');
    const data = await verifyAdminSession(session.value);
    return data?.role || null;
  } catch { return null; }
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
  const role = await getAdminRole();
  if (!['ADMIN', 'SUPPORT'].includes(role || '')) throw new Error('Unauthorized');

  const { search, type, status, minAmount, maxAmount, startDate, endDate } = params;

  const where: any = {};
  if (type && type !== 'ALL') where.type = type;
  if (status && status !== 'ALL') where.status = status;
  if (minAmount || maxAmount) {
    where.amount = {};
    if (minAmount) where.amount.gte = parseFloat(minAmount);
    if (maxAmount) where.amount.lte = parseFloat(maxAmount);
  }
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }
  if (search) {
    const isNumeric = /^\d+$/.test(search);
    where.OR = [
      { id: { contains: search, mode: 'insensitive' } },
      { externalId: { contains: search, mode: 'insensitive' } },
      { user: { username: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      isNumeric ? { user: { tgId: BigInt(search) } } : undefined,
    ].filter(Boolean);
  }

  const txs = await prisma.transaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { user: true }
  });

  // Формируем CSV
  const headers = ['ID', 'Date', 'User', 'TG_ID', 'Type', 'Amount', 'Status', 'External_ID'];
  const rows = txs.map(t => [
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
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}
