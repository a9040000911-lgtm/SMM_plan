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
}

export async function getUserReferralData(userId: string) {
  await verifyAdmin();

  // Получаем список рефералов 1-го уровня с их тратами
  const referrals = await prisma.user.findMany({
    where: { referrerId: userId },
    select: {
      id: true,
      username: true,
      email: true,
      spent: true,
      createdAt: true,
      _count: { select: { orders: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Serialize Decimal fields to strings
  const serializedReferrals = referrals.map(r => ({
    ...r,
    spent: r.spent.toString(), // Convert Decimal to string
  }));

  // Расчет прибыли платформы с этой ветки
  // (Допустим, 10% от трат рефералов уходит пригласителю, остальное - доход системы)
  const totalSpentByNetwork = serializedReferrals.reduce((acc, r) => acc + parseFloat(r.spent), 0);
  
  return {
    referrals: serializedReferrals,
    stats: {
      totalCount: serializedReferrals.length,
      totalSpent: totalSpentByNetwork,
      averageLTV: serializedReferrals.length > 0 ? totalSpentByNetwork / serializedReferrals.length : 0
    }
  };
}
