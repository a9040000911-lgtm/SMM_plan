'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/utils/admin-session';
import { bot } from '@/lib/bot';
import { AdminServices } from '@/services/admin/registry';
import { AdminContext } from '@/services/types';

async function requireAdmin(): Promise<AdminContext> {
  const session = await getAdminSession();
  if (!session || session.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
  return {
    userId: session.id,
    role: session.role as any,
    allowedProjects: session.allowedProjects,
    isGlobalAdmin: session.isGlobalAdmin
  };
}

export async function createNewsAction(formData: FormData) {
  const ctx = await requireAdmin();
  
  const data = {
    title: formData.get('title') as string,
    content: formData.get('content') as string,
    imageUrl: formData.get('imageUrl') as string,
    projectId: formData.get('projectId') as string,
  };

  const result = await AdminServices.management.createNews(ctx, data);
  if (!result.success) throw new Error(result.error.message);

  revalidatePath('/admin/content');
  redirect('/admin/content?tab=news');
}

export async function deleteNewsAction(id: string) {
  const ctx = await requireAdmin();
  const result = await AdminServices.management.deleteNews(ctx, id);
  
  if (result.success) {
    revalidatePath('/admin/content');
    return { success: true };
  } else {
    return { success: false, error: 'Не удалось удалить новость.' };
  }
}

export async function broadcastNewsAction(newsId: string) {
  const ctx = await requireAdmin();
  
  try {
    const result = await AdminServices.management.getNewsAndTargetUsers(ctx, newsId);
    if (!result.success) return { success: false, error: result.error.message };

    const { news, users } = result.data;
    let successCount = 0;
    let failCount = 0;

    for (const user of users) {
      try {
        if (news.imageUrl) {
          await bot.telegram.sendPhoto(user.tgId!.toString(), news.imageUrl, {
            caption: `<b>${news.title}</b>\n\n${news.content}`,
            parse_mode: 'HTML'
          });
        } else {
          await bot.telegram.sendMessage(user.tgId!.toString(), `<b>${news.title}</b>\n\n${news.content}`, {
            parse_mode: 'HTML'
          });
        }
        successCount++;
      } catch (e) {
        console.error(`Failed to send to ${user.tgId}:`, e);
        failCount++;
      }
    }

    await AdminServices.management.markNewsAsSent(ctx, newsId);

    revalidatePath('/admin/news');
    return { success: true, successCount, failCount };
  } catch (error: any) {
    console.error('Broadcast failed:', error);
    return { success: false, error: error.message };
  }
}
