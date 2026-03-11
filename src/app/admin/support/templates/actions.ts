'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
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

export async function createTemplateAction(title: string, content: string) {
  const role = await getAdminRole();
  if (!['ADMIN', 'SUPPORT'].includes(role || '')) throw new Error('Unauthorized');

  await prisma.supportTemplate.create({
    data: { title, content }
  });

  revalidatePath('/admin/support/templates');
  return { success: true };
}

export async function updateTemplateAction(id: string, title: string, content: string) {
  const role = await getAdminRole();
  if (!['ADMIN', 'SUPPORT'].includes(role || '')) throw new Error('Unauthorized');

  await prisma.supportTemplate.update({
    where: { id },
    data: { title, content }
  });

  revalidatePath('/admin/support/templates');
  return { success: true };
}

export async function deleteTemplateAction(id: string) {
  const role = await getAdminRole();
  if (!['ADMIN', 'SUPPORT'].includes(role || '')) throw new Error('Unauthorized');

  await prisma.supportTemplate.delete({
    where: { id }
  });

  revalidatePath('/admin/support/templates');
  return { success: true };
}
