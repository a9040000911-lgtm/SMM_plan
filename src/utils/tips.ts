/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Platform, Category } from '@/generated/client';

export function getLinkTips(platform: Platform, possibleCategories: Category[], objectType: string, isPrivate?: boolean): string {
  const tips: string[] = [];

  // --- TELEGRAM ---
  if (platform === Platform.TELEGRAM) {
    if (possibleCategories.includes(Category.REFERRALS)) {
      tips.push('🔗 <b>Ссылка:</b> должна быть вида <code>t.me/bot?start=123</code>.');
      tips.push('🤖 <b>Бот:</b> убедитесь, что ваш бот запущен и принимает новых пользователей.');
    } else {
      if (isPrivate) {
        tips.push('🔐 <b>Приватность:</b> убедитесь, что инвайт-ссылка (t.me/+) рабочая.');
      } else {
        tips.push('📢 <b>Username:</b> не меняйте @имя канала до полного завершения заказа.');
      }

      if (possibleCategories.includes(Category.REACTIONS)) {
        tips.push('👍 <b>Реакции:</b> работают ТОЛЬКО в каналах. В группах накрутка невозможна.');
        tips.push('🔔 <b>Важно:</b> проверьте, что выбранные эмодзи включены в настройках канала.');
      }
    }
  }

  // --- VK ---
  if (platform === Platform.VK) {
    tips.push('🔓 <b>Приватность:</b> профиль или группа должны быть ОТКРЫТЫМИ.');
    if (objectType === 'group') {
      tips.push('👥 <b>Участники:</b> список подписчиков должен быть виден всем (в настройках группы).');
    }
    if (possibleCategories.includes(Category.REPOSTS)) {
      tips.push('📢 <b>Репосты:</b> кнопка "Поделиться" должна быть доступна под постом.');
    }
  }

  // --- INSTAGRAM ---
  if (platform === Platform.INSTAGRAM) {
    tips.push('📸 <b>Приватность:</b> страница должна быть ОТКРЫТА!');
    if (possibleCategories.includes(Category.SUBSCRIBERS)) {
      tips.push('🚫 <b>Внимание:</b> обязательно отключите функцию "Пометить для проверки", иначе накрутка работать не будет.');
      tips.push('🛠 <b>Как:</b> Настройки -> Пригласить друзей и подписаться -> Отключите "Пометить для проверки".');
    }
  }

  // --- YOUTUBE ---
  if (platform === Platform.YOUTUBE) {
    tips.push('🎥 <b>Доступ:</b> видео должно быть открыто для всех.');
    if (possibleCategories.includes(Category.VIEWS)) {
      tips.push('🔗 <b>Встраивание:</b> в настройках видео ОБЯЗАТЕЛЬНО разрешите "Встраивание видео".');
      tips.push('🔞 <b>Ограничения:</b> убедитесь, что на видео нет ограничений по возрасту или странам.');
    }
  }

  // --- STREAMING (TWITCH/KICK) ---
  if (platform === Platform.TWITCH || platform === Platform.KICK) {
    if (possibleCategories.includes(Category.VIEWS)) {
      tips.push('🎮 <b>Статус:</b> заказывайте зрителей только когда стрим уже идет (ONLINE).');
    }
  }

  if (tips.length === 0) return '';

  return `\n\n💡 <b>СОВЕТЫ И ТРЕБОВАНИЯ:</b>\n${tips.map(t => `└ ${t}`).join('\n')}`;
}

export function getWebSmartHint(platform: string | undefined): string {
  if (!platform) return "Убедитесь, что аккаунт открыт и доступен.";
  const p = platform.toUpperCase();
  switch (p) {
    case "TELEGRAM":
      return "Для инвайт-ссылок убедитесь, что бот добавлен в канал. Для публичных ссылок — аккаунт должен быть открытым.";
    case "INSTAGRAM":
      return "Профиль должен быть открыт на время выполнения заказа. Не меняйте логин.";
    case "YOUTUBE":
      return "Видео должно быть открытым для всех. Длительность — минимум 1 минута.";
    case "VK":
      return "Стена/профиль должны быть открыты для неавторизованных пользователей.";
    case "TIKTOK":
      return "Профиль должен быть публичным. Не удаляйте видео во время накрутки.";
    default:
      return "Убедитесь, что ваш аккаунт/публикация открыты для всех пользователей.";
  }
}
