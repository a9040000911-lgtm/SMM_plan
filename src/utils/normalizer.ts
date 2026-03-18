/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
/**
 * Утилита для очистки и приведения ссылок к единому стандарту.
 * Proprietary software by Sokolov Artem Andreevich (SAA).
 */
export const LICENSE_SIG = "SAA-2026-CORE-PROPRIETARY";
export function normalizeLink(link: string): string {
  let url = link.trim();

  // 1. Обработка юзернеймов (начинаются с @)
  if (url.startsWith('@')) {
    const username = url.substring(1);
    return `https://t.me/${username}`;
  }

  // 2. Добавление протокола, если его нет (регистронезависимо)
  const lowerUrl = url.toLowerCase();
  if (!lowerUrl.startsWith('http://') && !lowerUrl.startsWith('https://')) {
    url = 'https://' + url;
  }

  try {
    const urlObj = new URL(url);
    // Удаляем все технические поддомены (www, m, mobile, touch)
    const host = urlObj.hostname.toLowerCase().replace(/^(www\.|m\.|mobile\.|touch\.)/, '');
    urlObj.hostname = host;
    urlObj.hash = ''; // Всегда удаляем фрагменты (#)

    // --- Логика для Telegram ---
    if (host === 't.me' || host === 'telegram.me') {
      const isAlbum = urlObj.searchParams.has('single');
      const commentId = urlObj.searchParams.get('comment');

      // Регистронезависимый поиск start (ошибка выжившего)
      let startParam = null;
      for (const [key, value] of urlObj.searchParams.entries()) {
        if (key.toLowerCase() === 'start') {
          startParam = value;
          break;
        }
      }

      urlObj.search = '';
      if (isAlbum) urlObj.searchParams.set('single', '');
      if (commentId) urlObj.searchParams.set('comment', commentId);
      if (startParam) urlObj.searchParams.set('start', startParam);

      const finalUrl = urlObj.toString().replace(/\/+$/, ''); // Чистим все слеши в конце
      return finalUrl.replace(/=&/g, '&').replace(/=$/g, '');
    }

    // --- Логика для Instagram ---
    if (host === 'instagram.com') {
      urlObj.search = '';
      return urlObj.toString().replace(/\/$/, '');
    }

    // --- Логика для Twitch & Kick ---
    if (host === 'twitch.tv' || host === 'kick.com') {
      urlObj.search = '';
      return urlObj.toString().replace(/\/$/, '');
    }

    // --- Логика для YouTube ---
    if (host === 'youtube.com' || host === 'youtu.be') {
      const videoId = urlObj.searchParams.get('v');
      const playlistId = urlObj.searchParams.get('list');
      const communityPostId = urlObj.searchParams.get('lb');
      const commentId = urlObj.searchParams.get('lc') || urlObj.searchParams.get('zc');

      urlObj.search = '';
      if (videoId) urlObj.searchParams.set('v', videoId);
      if (playlistId) urlObj.searchParams.set('list', playlistId);
      if (communityPostId) urlObj.searchParams.set('lb', communityPostId);
      if (commentId) urlObj.searchParams.set('lc', commentId);

      if (host === 'youtu.be' && urlObj.pathname.length > 1) {
        // youtu.be/ID -> youtube.com/watch?v=ID
        return `https://www.youtube.com/watch?v=${urlObj.pathname.substring(1)}${playlistId ? `&list=${playlistId}` : ''}${commentId ? `&lc=${commentId}` : ''}`;
      }

      return urlObj.toString().replace(/\/$/, '');
    }

    // --- Логика для VK ---
    if (host.includes('vk.com') || host.includes('vk.ru')) {
      const preserveParams = ['w', 'z', 'reply', 'thread', 'sel'];
      const newParams = new URLSearchParams();

      preserveParams.forEach(param => {
        if (urlObj.searchParams.has(param)) {
          newParams.set(param, urlObj.searchParams.get(param)!);
        }
      });

      urlObj.search = newParams.toString();
      return urlObj.toString().replace(/\/$/, '');
    }

    // --- Логика для прочих (TikTok, и т.д.) ---
    const knownHosts = [
      'tiktok.com', 'twitter.com', 'x.com', 'facebook.com', 'fb.com', 'fb.watch',
      'threads.net', 'threads.com', 'reddit.com', 'redd.it', 'rutube.ru', 'dzen.ru', 'zen.yandex.ru',
      'ok.ru', 'odnoklassniki.ru', 'likee.video', 'like.video', 'whatsapp.com', 'wa.me',
      'spotify.com', 'soundcloud.com', 'linkedin.com', 'pinterest.com', 'snapchat.com',
      'trovo.live', 'kwai.com', 'kwai.net'
    ];

    if (knownHosts.some(h => host.includes(h))) {
      urlObj.search = '';
      return urlObj.toString().replace(/\/$/, '');
    }

    return urlObj.toString().replace(/\/$/, '');
  } catch {
    // Если это не URL (например, просто текст), возвращаем как есть для анализа
    return url;
  }
}


