'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/utils/admin-session';
import { AdminServices } from '@/services/admin/registry';
import { AdminContext } from '@/services/types';
import { Role } from '@/generated/client';

export type ActionState = {
  error?: string;
  success?: boolean;
};

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

export type CreateUserState = ActionState;

// --- CREATE USER ---

export async function createUserAction(prevState: CreateUserState, formData: FormData): Promise<CreateUserState> {
  const session = await getAdminSession();
  if (!session || !['ADMIN', 'SUPPORT'].includes(session.role)) {
    return { error: 'Unauthorized' };
  }

  const username = formData.get('username') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as Role;
  const balance = parseFloat(formData.get('balance') as string) || 0;

  if (role === 'ADMIN' && !session.isGlobalAdmin) {
    return { error: 'Только глобальный администратор может создавать других администраторов' };
  }

  if (!username) {
    return { error: 'Имя пользователя обязательно' };
  }

  const ctx: AdminContext = {
    userId: session.id,
    role: session.role as any,
    allowedProjects: session.allowedProjects,
    isGlobalAdmin: session.isGlobalAdmin
  };

  const result = await AdminServices.users.createUser(ctx, { username, email, password, role, balance });
  if (!result.success) return { error: result.error.message };

  // Send welcome email if email is provided and password is set
  if (email && password) {
    try {
      const { sendAdminCreatedUserEmail } = await import('@/services/mail.service');
      await sendAdminCreatedUserEmail(email, password, username);
    } catch (mailError) {
      console.error('Failed to send welcome email:', mailError);
    }
  }

  revalidatePath('/admin/users');
  redirect('/admin/users');
}

// --- UPDATE CREDENTIALS (Email/Password) ---

export async function updateCredentialsAction(userId: string, data: { email?: string, password?: string }) {
  try {
    const ctx = await getCtx();
    const result = await AdminServices.users.updateUser(ctx, userId, data);
    
    if (!result.success) {
      // Unwrapping ZodError for tests and robust reporting
      if (result.error?.details?.name === 'ZodError') {
        throw result.error.details;
      }
      throw new Error(result.error.message);
    }

    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
  } catch (err: any) {
    // Ensuring ZodErrors bubble up to test runners
    if (err.name === 'ZodError') throw err;
    throw err;
  }
}

// --- CHANGE ROLE ---

export async function changeRoleAction(userId: string, newRole: Role) {
  const ctx = await getCtx();
  if (newRole === 'ADMIN' && !ctx.isGlobalAdmin) {
    throw new Error('Только глобальный администратор может назначать права администратора');
  }

  const result = await AdminServices.users.updateUser(ctx, userId, { role: newRole });
  if (!result.success) throw new Error(result.error.message);

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath('/admin/users');
  return { success: true };
}

// --- ADJUST BALANCE ---

export async function adjustBalanceAction(userId: string, amount: number, reason: string) {
  try {
    const ctx = await getCtx();
    const result = await AdminServices.users.adjustUserBalance(ctx, { userId, amount, reason });
    
    if (!result.success) {
      if (result.error?.details?.name === 'ZodError') {
        throw result.error.details;
      }
      throw new Error(result.error.message);
    }

    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
  } catch (err: any) {
    if (err.name === 'ZodError') throw err;
    throw err;
  }
}

// --- SOFT DELETE (Archive) ---

export async function softDeleteUserAction(userId: string) {
  const ctx = await getCtx();
  const result = await AdminServices.users.archiveUser(ctx, userId);
  if (!result.success) throw new Error(result.error.message);

  revalidatePath('/admin/users');
  return { success: true };
}

// --- BULK UPDATE USER ---

export async function updateUserAction(userId: string, data: any) {
  try {
    const ctx = await getCtx();
    const result = await AdminServices.users.updateUser(ctx, userId, data);
    
    if (!result.success) {
      if (result.error?.details?.name === 'ZodError') {
        throw result.error.details;
      }
      throw new Error(result.error.message);
    }

    // Send email if password was updated
    if (data.password) {
       const userData = await AdminServices.users.getUserQuickViewData(ctx, userId);
       if (userData.success && userData.data.email) {
         try {
           const { sendPasswordUpdateEmail } = await import('@/services/mail.service');
           await sendPasswordUpdateEmail(userData.data.email, data.password, userData.data.username || userId);
         } catch (mailError) {
           console.error('Failed to send password update email:', mailError);
         }
       }
    }

    revalidatePath(`/admin/users/${userId}`);
    revalidatePath('/admin/users');
    return { success: true };
  } catch (err: any) {
    if (err.name === 'ZodError') throw err;
    throw err;
  }
}

// --- QUICK VIEW DATA ---

export async function getUserQuickViewData(userId: string) {
  const ctx = await getCtx();
  const result = await AdminServices.users.getUserQuickViewData(ctx, userId);
  if (!result.success) throw new Error(result.error.message);
  return result.data;
}


