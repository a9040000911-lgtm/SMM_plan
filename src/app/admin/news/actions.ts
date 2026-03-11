'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/utils/admin-session';
import { bot } from '@/lib/bot';

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session || session.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function createNewsAction(formData: FormData) {
  await requireAdmin();
  
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const imageUrl = formData.get('imageUrl') as string;
  const projectId = formData.get('projectId') as string;

  await prisma.news.create({
    data: {
      title,
      content,
      imageUrl: imageUrl || null,
      projectId: projectId || null,
    }
  });

  revalidatePath('/admin/content');
  redirect('/admin/content?tab=news');
}

export async function deleteNewsAction(id: string) {
  try {
    await prisma.news.delete({
      where: { id }
    });
    revalidatePath('/admin/content');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete news:', error);
    return { success: false, error: 'Не удалось удалить новость.' };
  }
}

export async function broadcastNewsAction(newsId: string) {
  try {
    const news = await prisma.news.findUnique({ where: { id: newsId } });
    if (!news) return { success: false, error: 'Новость не найдена' };

    const users = await prisma.user.findMany({
      where: {
        tgId: { not: null },
        projectId: news.projectId // Only target users of this project
      },
      select: { tgId: true }
    });

    let successCount = 0;
    let failCount = 0;

    // Send messages sequentially to avoid spam limits/complexity for now
    // A better approach would be a background queue
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

    await prisma.news.update({
      where: { id: newsId },
      data: { isSent: true }
    });

    revalidatePath('/admin/news');
    return { success: true, successCount, failCount };
  } catch (error: any) {
    console.error('Broadcast failed:', error);
    return { success: false, error: error.message };
  }
}
