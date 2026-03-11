'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

async function getAdminName() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session) return 'Admin';
  const { verifyAdminSession } = await import('@/lib/jwt');
  const data = await verifyAdminSession(session.value);
  return data?.username || 'Admin';
}

/**
 * Обновляет метку присутствия сотрудника в тикете
 */
export async function setPresence(ticketId: string) {
  const adminName = await getAdminName();

  // Мы используем таблицу Settings как временное хранилище (key-value)
  // В идеале тут должен быть Redis, но для текущей архитектуры Settings подойдет
  const presenceKey = `SUPPORT_PRESENCE_${ticketId}`;
  const now = new Date().toISOString();

  await prisma.settings.upsert({
    where: { projectId_key: { projectId: 'global', key: presenceKey } },
    update: { value: `${adminName}|${now}` },
    create: { projectId: 'global', key: presenceKey, value: `${adminName}|${now}` }
  });

  return { success: true };
}

/**
 * Проверяет, кто сейчас в тикете (кроме текущего админа)
 */
export async function getTicketPresence(ticketId: string) {
  const adminName = await getAdminName();
  const presenceKey = `SUPPORT_PRESENCE_${ticketId}`;

  const record = await prisma.settings.findUnique({
    where: { projectId_key: { projectId: 'global', key: presenceKey } }
  });

  if (!record) return null;

  const [name, time] = record.value.split('|');
  const lastSeen = new Date(time);
  const diff = Date.now() - lastSeen.getTime();

  // Если сотрудника видели менее 30 секунд назад и это не текущий админ
  if (diff < 30000 && name !== adminName) {
    return name;
  }

  return null;
}
