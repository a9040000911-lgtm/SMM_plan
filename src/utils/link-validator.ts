/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export type TargetType =
  | 'POST'           // Пост
  | 'CHANNEL'        // Сообщество/Группа
  | 'PROFILE'        // Профиль
  | 'VIDEO'          // Видео/Клип
  | 'PHOTO'          // Фото
  | 'ALBUM'          // Альбом (Фото или Музыка)
  | 'PLAYLIST'       // Плейлист (Музыка)
  | 'CHANNEL_POSTS'  // Авто-посты
  | 'STORY'          // Сторис
  | 'POLL'           // Опрос/Голосование
  | 'MARKET'         // Товар
  | 'EXTERNAL'       // Внешний сайт
  | 'CUSTOM';

export type Platform =
  | 'TELEGRAM' | 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE'
  | 'VK' | 'TWITCH' | 'FACEBOOK' | 'TWITTER' | 'MAX' | 'OK' | 'MUSIC' | 'OTHER';

export function validateLink(link: string, platform: Platform, targetType: string): { isValid: boolean; error?: string } {
  const url = link.toLowerCase().trim();
  if (!url) return { isValid: false, error: 'Ссылка пустая' };

  switch (platform) {
    case 'VK':
      if (targetType === 'PLAYLIST') {
        return url.includes('music/playlist') ? { isValid: true } : { isValid: false, error: 'Нужна ссылка на плейлист VK' };
      }
      if (targetType === 'ALBUM') {
        return url.includes('album') ? { isValid: true } : { isValid: false, error: 'Нужна ссылка на альбом VK' };
      }
      if (targetType === 'POLL') {
        // Опрос обычно идет как wall-пост, но иногда провайдеры просят прямую ссылку на poll
        return url.includes('wall') || url.includes('poll') ? { isValid: true } : { isValid: false, error: 'Нужна ссылка на пост с опросом' };
      }
      if (targetType === 'PHOTO') {
        return url.includes('photo') || url.includes('z=photo') ? { isValid: true } : { isValid: false, error: 'Нужна ссылка на фото' };
      }
      break;
  }

  return { isValid: true };
}
