/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */


import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('admin_session')?.value;
    if (!tokenCookie) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { verifyAdminSession } = await import('@/services/core/jwt');
    const session = await verifyAdminSession(tokenCookie);
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { fileId } = await params;
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) throw new Error('BOT_TOKEN_MISSING');

    // 1. Получаем путь к файлу через Telegram API
    const getFileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const getFileData = await getFileRes.json();

    if (!getFileData.ok) {
      return new Response('Telegram API Error', { status: 400 });
    }

    const filePath = getFileData.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

    // 2. Стримим сам файл пользователю
    const response = await fetch(fileUrl);
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error: any) {
    console.error('Media Proxy Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
