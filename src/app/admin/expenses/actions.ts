'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Decimal } from 'decimal.js';
import { cookies } from 'next/headers';

async function verifyAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session) throw new Error('Unauthorized');
  const { verifyAdminSession } = await import('@/lib/jwt');
  const data = await verifyAdminSession(session.value);
  if (!data || data.role !== 'ADMIN') throw new Error('Admin only');
}

export async function createExpenseAction(formData: FormData) {
  await verifyAdmin();

  const category = formData.get('category') as any;
  const amount = new Decimal(formData.get('amount') as string);
  const description = formData.get('description') as string;
  const dateStr = formData.get('date') as string;

  // Determine Project ID
  const cookieStore = await cookies();
  const sessionData = cookieStore.get('admin_session');
  const { verifyAdminSession } = await import('@/lib/jwt');
  const session = sessionData ? await verifyAdminSession(sessionData.value) : null;

  let projectId = formData.get('projectId') as string | null;

  if (!projectId && session && !session.isGlobalAdmin && session.allowedProjects.length > 0) {
    projectId = session.allowedProjects[0];
  }

  // If projectId is an empty string, set it to null (Global Expense)
  if (projectId === '') projectId = null;

  await prisma.businessExpense.create({
    data: {
      category,
      amount,
      description,
      date: dateStr ? new Date(dateStr) : new Date(),
      projectId: projectId // Key addition
    }
  });

  revalidatePath('/admin/expenses');
  revalidatePath('/admin/reports');
}

export async function deleteExpenseAction(id: string) {
  await verifyAdmin();
  await prisma.businessExpense.delete({ where: { id } });
  revalidatePath('/admin/expenses');
}

export async function getExpensesTotal(startDate: string, endDate: string) {
  const expenses = await prisma.businessExpense.aggregate({
    where: {
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59.999Z'),
      }
    },
    _sum: { amount: true }
  });

  return expenses._sum.amount?.toNumber() || 0;
}
