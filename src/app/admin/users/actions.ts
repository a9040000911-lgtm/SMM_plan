'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { Role, LedgerEntryType } from '@/generated/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Decimal from 'decimal.js';
import { getAdminSession } from '@/utils/admin-session';

import { z } from 'zod';

export type ActionState = {
  error?: string;
  success?: boolean;
};

const UpdateCredentialsSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

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

  try {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: username, mode: 'insensitive' } },
          { email: { equals: email, mode: 'insensitive' } }
        ]
      }
    });

    if (existing) {
      return { error: 'Пользователь с таким именем или email уже существует' };
    }


    await prisma.user.create({
      data: {
        username,
        email: email || null,
        role: role || 'USER',
        balance: balance,
        password: password || null,
        // We log the initial balance if > 0
        ledgerEntries: balance > 0 ? {
          create: {
            amount: balance,
            type: LedgerEntryType.MANUAL_ADJUSTMENT,
            description: 'Initial balance',
            currency: 'RUB',
            balanceBefore: 0,
            balanceAfter: balance
          }
        } : undefined
      }
    });

    // Send welcome email if email is provided and password is set
    if (email && password) {
      try {
        const { sendAdminCreatedUserEmail } = await import('@/services/mail.service');
        await sendAdminCreatedUserEmail(email, password, username);
      } catch (mailError) {
        console.error('Failed to send welcome email:', mailError);
        // We don't fail the request if email fails, just log it
      }
    }

    revalidatePath('/admin/users');
  } catch (error: any) {
    console.error('Create user error:', error);
    return { error: error.message || 'Ошибка создания пользователя' };
  }

  redirect('/admin/users');
}

// --- UPDATE CREDENTIALS (Email/Password) ---

export async function updateCredentialsAction(userId: string, data: { email?: string, password?: string }) {
  if (!userId) throw new Error('User ID is required');
  const session = await getAdminSession();
  if (!session || !['ADMIN', 'SUPPORT'].includes(session.role)) throw new Error('Unauthorized');

  try {
    const validated = UpdateCredentialsSchema.parse(data);
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(validated.email ? { email: validated.email } : {}),
        ...(validated.password ? { password: validated.password } : {})
      }
    });
    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
  } catch (e: any) {
    if (e.name === 'ZodError') throw e;
    throw new Error(e.message || 'Failed to update credentials');
  }
}

// --- CHANGE ROLE ---

export async function changeRoleAction(userId: string, newRole: Role) {
  if (!userId) throw new Error('User ID is required');
  const session = await getAdminSession();
  if (!session || (session.role !== 'ADMIN' && !session.isGlobalAdmin)) throw new Error('Unauthorized');

  if (newRole === 'ADMIN' && !session.isGlobalAdmin) {
    throw new Error('Только глобальный администратор может назначать права администратора');
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole }
    });
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath('/admin/users');
    return { success: true };
  } catch (e: any) {
    throw new Error(e.message || 'Failed to change role');
  }
}

// --- ADJUST BALANCE ---

export async function adjustBalanceAction(userId: string, amount: number, reason: string) {
  if (!userId) throw new Error('User ID is required');
  if (isNaN(amount) || amount === 0) throw new Error('Amount cannot be zero');

  const session = await getAdminSession();
  if (!session || (session.role !== 'ADMIN' && !session.isGlobalAdmin)) throw new Error('Unauthorized');

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const oldBalance = user.balance.toNumber();
    const newBalance = oldBalance + amount;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { balance: newBalance }
      }),
      prisma.ledgerEntry.create({
        data: {
          userId,
          amount: amount,
          type: LedgerEntryType.MANUAL_ADJUSTMENT,
          description: reason || 'Admin adjustment',
          currency: 'RUB',
          balanceBefore: oldBalance,
          balanceAfter: newBalance
        }
      })
    ]);

    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
  } catch (e: any) {
    throw new Error(e.message || 'Failed to adjust balance');
  }
}

// --- SOFT DELETE (Archive) ---

export async function softDeleteUserAction(userId: string) {
  if (!userId) throw new Error('User ID is required');
  const session = await getAdminSession();
  if (!session || (session.role !== 'ADMIN' && !session.isGlobalAdmin)) throw new Error('Unauthorized');

  try {
    // "Soft delete" in this context seems to mean removing PII and disabling
    // based on the alert message: "TG ID и Email будут отвязаны, баланс обнулен"

    await prisma.user.update({
      where: { id: userId },
      data: {
        tgId: null,
        email: null,
        username: `archived_${userId.substring(0, 6)}`,
        balance: 0,
        isPermanentlyBanned: true, // Marking as banned/archived
        deletedAt: new Date()
      }
    });

    revalidatePath('/admin/users');
    return { success: true };
  } catch (e: any) {
    throw new Error(e.message || 'Failed to archive user');
  }
}
// --- BULK UPDATE USER ---

export async function updateUserAction(userId: string, data: {
  username?: string,
  email?: string | null,
  password?: string,
  role?: Role,
  balance?: number,
  referralEarnings?: number,
  referralPercent?: number,
  isBanned?: boolean,
  moderationNote?: string,
  isGlobalAdmin?: boolean
}) {
  if (!userId) throw new Error('User ID is required');

  const session = await getAdminSession();
  if (!session || !['ADMIN', 'SUPPORT'].includes(session.role)) throw new Error('Unauthorized');

  if (data.role === 'ADMIN' && !session.isGlobalAdmin) {
    throw new Error('Только глобальный администратор может назначать права администратора');
  }

  try {
    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser) throw new Error('User not found');

    console.log(`[updateUserAction] ID: ${userId}, Data:`, JSON.stringify(data));

    const updateData: any = {
      ...(data.username ? { username: data.username } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.password ? { password: data.password } : {}),
      ...(data.role ? { role: data.role } : {}),
      ...(data.referralPercent !== undefined ? { referralPercent: data.referralPercent } : {}),
      ...(data.isBanned !== undefined ? { isPermanentlyBanned: data.isBanned } : {}),
      ...(data.moderationNote !== undefined ? { moderationNote: data.moderationNote } : {}),
      ...(data.isGlobalAdmin !== undefined ? { isGlobalAdmin: data.isGlobalAdmin } : {})
    };

    // Handle balance adjustment if changed
    if (data.balance !== undefined) {
      const balanceAmount = new Decimal(data.balance);
      const oldBalance = currentUser.balance;

      if (!balanceAmount.equals(oldBalance)) {
        updateData.balance = balanceAmount;
        // We add a transaction for balance changes
        await prisma.ledgerEntry.create({
          data: {
            userId,
            amount: balanceAmount.minus(oldBalance),
            type: LedgerEntryType.MANUAL_ADJUSTMENT,
            description: 'Корректировка из профиля',
            currency: 'RUB',
            balanceBefore: oldBalance,
            balanceAfter: balanceAmount
          }
        });
      }
    }

    // Handle referral earnings adjustment
    if (data.referralEarnings !== undefined) {
      updateData.referralEarnings = data.referralEarnings;
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    // Send email if password was updated
    if (data.password && currentUser.email) {
      try {
        const { sendPasswordUpdateEmail } = await import('@/services/mail.service');
        await sendPasswordUpdateEmail(currentUser.email, data.password, currentUser.username || currentUser.id);
      } catch (mailError) {
        console.error('Failed to send password update email:', mailError);
      }
    }

    revalidatePath(`/admin/users/${userId}`);
    revalidatePath('/admin/users');
    return { success: true };
  } catch (e: any) {
    console.error('Update user error:', e);
    throw new Error(e.message || 'Failed to update user');
  }
}

// --- QUICK VIEW DATA ---

export async function getUserQuickViewData(userId: string) {
  const session = await getAdminSession();
  if (!session || !['ADMIN', 'SUPPORT'].includes(session.role)) throw new Error('Unauthorized');

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        balance: true,
        isPermanentlyBanned: true,
        _count: {
          select: {
            orders: true,
            referrals: true
          }
        }
      }
    });

    if (!user) throw new Error('User not found');

    return {
      ...user,
      balance: user.balance.toNumber()
    };
  } catch (e: any) {
    throw new Error(e.message || 'Failed to fetch quick view data');
  }
}
