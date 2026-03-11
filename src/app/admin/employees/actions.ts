'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function updateStaffAccessAction(userId: string, projectIds: string[], isGlobal: boolean, allowedTabs: string[] = [], permissions: string[] = []) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  const { verifyAdminSession } = await import('@/lib/jwt');
  const adminData = session ? await verifyAdminSession(session.value) : null;

  if (!adminData || !adminData.isGlobalAdmin) {
    throw new Error('Unauthorized: Only Global Admin can modify access');
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      isGlobalAdmin: isGlobal,
      allowedTabs: allowedTabs,
      permissions: permissions, // Save permissions
      accessibleProjects: {
        set: projectIds.map(id => ({ id }))
      }
    }
  });

  revalidatePath('/admin/employees');
  return { success: true };
}

export async function createEmployeeAction(data: any) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  const { verifyAdminSession } = await import('@/lib/jwt');
  const adminData = session ? await verifyAdminSession(session.value) : null;

  if (!adminData || !adminData.isGlobalAdmin) {
    throw new Error('Unauthorized');
  }

  const { email, username, password, role, projectIds, isGlobalAdmin, allowedTabs } = data;
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password: hashedPassword,
      role: role,
      isGlobalAdmin: isGlobalAdmin || false,
      allowedTabs: allowedTabs || [],
      projectId: projectIds && projectIds.length > 0 ? projectIds[0] : null,
      accessibleProjects: {
        connect: (projectIds || []).map((id: string) => ({ id }))
      }
    }
  });

  revalidatePath('/admin/employees');
  return { success: true, userId: user.id };
}

export async function deleteEmployeeAction(userId: string) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  const { verifyAdminSession } = await import('@/lib/jwt');
  const adminData = session ? await verifyAdminSession(session.value) : null;

  if (!adminData || !adminData.isGlobalAdmin) {
    throw new Error('Unauthorized');
  }

  // Soft delete: set deletedAt and mangle unique fields to allow re-registration
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const now = new Date();
  const timestamp = now.getTime();

  await prisma.user.update({
    where: { id: userId },
    data: {
      deletedAt: now,
      // Mangle unique fields so they don't block new users with same email/tgId
      email: user.email ? `deleted_${timestamp}_${user.email}` : null,
      username: user.username ? `deleted_${timestamp}_${user.username}` : null,
      tgId: null, // tgId is unique per project, we clear it to allow the same TG user to be re-added if needed
    }
  });

  revalidatePath('/admin/employees');
  return { success: true };
}
