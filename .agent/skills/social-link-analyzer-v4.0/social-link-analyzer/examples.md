# Примеры анализа ссылок

Этот документ содержит практические примеры анализа ссылок для каждой поддерживаемой платформы.

---

## 1. ВКонтакте (VK)

### Пример 1.1: Анализ поста в сообществе

**Вход:** `https://vk.com/wall-22884714_12345`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": {
      "id": "vk",
      "name": "ВКонтакте",
      "category": "social_network"
    },
    "type": {
      "id": "wall_post",
      "name": "Пост на стене",
      "category": "content"
    },
    "ids": {
      "owner_id": -22884714,
      "post_id": 12345
    },
    "metadata": {
      "is_community": true,
      "community_id": 22884714
    },
    "url": {
      "original": "https://vk.com/wall-22884714_12345",
      "normalized": "https://vk.com/wall-22884714_12345"
    },
    "smm": {
      "available_services": ["likes", "comments", "reposts"],
      "recommended": "likes"
    }
  }
}
```

### Пример 1.2: Анализ VK Клипа

**Вход:** `https://m.vk.com/clip-12345678_987654321`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "vk", "name": "ВКонтакте" },
    "type": { "id": "clip", "name": "VK Клип" },
    "ids": {
      "owner_id": -12345678,
      "clip_id": 987654321
    },
    "url": {
      "original": "https://m.vk.com/clip-12345678_987654321",
      "normalized": "https://vk.com/clip-12345678_987654321"
    },
    "smm": {
      "available_services": ["views", "likes"],
      "recommended": "views"
    }
  }
}
```

### Пример 1.3: Анализ комментария

**Вход:** `https://vk.com/wall-22884714_12345?reply=67890&thread=11111`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "vk", "name": "ВКонтакте" },
    "type": { "id": "comment", "name": "Комментарий" },
    "ids": {
      "owner_id": -22884714,
      "post_id": 12345,
      "comment_id": 67890,
      "thread_id": 11111
    },
    "url": {
      "normalized": "https://vk.com/wall-22884714_12345?reply=67890"
    },
    "smm": {
      "available_services": ["comment_likes"],
      "note": "Для лайков на комментарий используйте эту ссылку"
    }
  }
}
```

---

## 2. YouTube

### Пример 2.1: Стандартное видео

**Вход:** `https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=90`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "youtube", "name": "YouTube" },
    "type": { "id": "video", "name": "Видео" },
    "ids": {
      "video_id": "dQw4w9WgXcQ"
    },
    "metadata": {
      "has_timestamp": true,
      "timestamp_seconds": 90
    },
    "url": {
      "original": "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=90",
      "normalized": "https://youtube.com/watch?v=dQw4w9WgXcQ"
    },
    "smm": {
      "available_services": ["views", "likes", "comments"],
      "recommended": "views"
    }
  }
}
```

### Пример 2.2: YouTube Shorts

**Вход:** `https://youtube.com/shorts/abc123XYZ45?feature=share`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "youtube", "name": "YouTube" },
    "type": { "id": "shorts", "name": "Shorts" },
    "ids": {
      "video_id": "abc123XYZ45"
    },
    "url": {
      "original": "https://youtube.com/shorts/abc123XYZ45?feature=share",
      "normalized": "https://youtube.com/shorts/abc123XYZ45"
    },
    "smm": {
      "available_services": ["views", "likes"],
      "recommended": "views"
    }
  }
}
```

### Пример 2.3: Канал

**Вход:** `https://youtube.com/@MrBeast`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "youtube", "name": "YouTube" },
    "type": { "id": "channel", "name": "Канал" },
    "ids": {
      "handle": "MrBeast"
    },
    "url": {
      "normalized": "https://youtube.com/@MrBeast"
    },
    "smm": {
      "available_services": ["subscribers"],
      "recommended": "subscribers"
    }
  }
}
```

---

## 3. Instagram

### Пример 3.1: Пост

**Вход:** `https://www.instagram.com/p/CgBxesYIjZ/?igshid=xyz123`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "instagram", "name": "Instagram" },
    "type": { "id": "post", "name": "Пост" },
    "ids": {
      "shortcode": "CgBxesYIjZ"
    },
    "url": {
      "original": "https://www.instagram.com/p/CgBxesYIjZ/?igshid=xyz123",
      "normalized": "https://instagram.com/p/CgBxesYIjZ"
    },
    "smm": {
      "available_services": ["likes", "comments", "saves"],
      "recommended": "likes"
    }
  }
}
```

### Пример 3.2: Reels

**Вход:** `https://instagram.com/reel/CgBxesYIjZ/`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "instagram", "name": "Instagram" },
    "type": { "id": "reel", "name": "Reels" },
    "ids": {
      "shortcode": "CgBxesYIjZ"
    },
    "url": {
      "normalized": "https://instagram.com/reel/CgBxesYIjZ"
    },
    "smm": {
      "available_services": ["views", "likes", "comments", "saves"],
      "recommended": "views"
    }
  }
}
```

### Пример 3.3: Профиль

**Вход:** `https://instagram.com/instagram/`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "instagram", "name": "Instagram" },
    "type": { "id": "profile", "name": "Профиль" },
    "ids": {
      "username": "instagram"
    },
    "url": {
      "normalized": "https://instagram.com/instagram"
    },
    "smm": {
      "available_services": ["followers"],
      "recommended": "followers"
    }
  }
}
```

---

## 4. TikTok

### Пример 4.1: Видео

**Вход:** `https://www.tiktok.com/@tiktok/video/1234567890123456789`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "tiktok", "name": "TikTok" },
    "type": { "id": "video", "name": "Видео" },
    "ids": {
      "username": "tiktok",
      "video_id": "1234567890123456789"
    },
    "metadata": {
      "video_id_length": 19,
      "is_valid_id": true
    },
    "url": {
      "normalized": "https://tiktok.com/@tiktok/video/1234567890123456789"
    },
    "smm": {
      "available_services": ["views", "likes", "comments", "shares"],
      "recommended": "views"
    }
  }
}
```

### Пример 4.2: Сокращённая ссылка

**Вход:** `https://vm.tiktok.com/ZM6abc123/`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "tiktok", "name": "TikTok" },
    "type": { "id": "video_shortlink", "name": "Сокращённая ссылка" },
    "ids": {
      "short_code": "ZM6abc123"
    },
    "requires_resolution": true,
    "note": "Требуется раскрытие редиректа для получения video_id",
    "resolution_url": "https://vm.tiktok.com/ZM6abc123/"
  }
}
```

### Пример 4.3: Live трансляция

**Вход:** `https://tiktok.com/@username/live`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "tiktok", "name": "TikTok" },
    "type": { "id": "live", "name": "Трансляция" },
    "ids": {
      "username": "username"
    },
    "url": {
      "normalized": "https://tiktok.com/@username/live"
    },
    "smm": {
      "available_services": ["viewers", "likes"],
      "recommended": "viewers",
      "warning": "Эфир должен быть активен на момент заказа"
    }
  }
}
```

---

## 5. Facebook

### Пример 5.1: Пост

**Вход:** `https://www.facebook.com/zuck/posts/10112345678901234`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "facebook", "name": "Facebook" },
    "type": { "id": "post", "name": "Пост" },
    "ids": {
      "username": "zuck",
      "post_id": "10112345678901234"
    },
    "url": {
      "normalized": "https://facebook.com/zuck/posts/10112345678901234"
    },
    "smm": {
      "available_services": ["likes", "comments", "shares"],
      "recommended": "likes"
    }
  }
}
```

### Пример 5.2: Reel

**Вход:** `https://fb.watch/abc123xyz/`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "facebook", "name": "Facebook" },
    "type": { "id": "reel", "name": "Reel" },
    "ids": {
      "watch_id": "abc123xyz"
    },
    "requires_resolution": true,
    "note": "fb.watch требует раскрытия для получения полного ID"
  }
}
```

---

## 6. X (Twitter)

### Пример 6.1: Твит

**Вход:** `https://twitter.com/elonmusk/status/1234567890123456789`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "twitter", "name": "X (Twitter)" },
    "type": { "id": "tweet", "name": "Твит" },
    "ids": {
      "username": "elonmusk",
      "tweet_id": "1234567890123456789"
    },
    "url": {
      "original": "https://twitter.com/elonmusk/status/1234567890123456789",
      "normalized": "https://x.com/elonmusk/status/1234567890123456789"
    },
    "smm": {
      "available_services": ["likes", "retweets", "views", "bookmarks"],
      "recommended": "likes"
    }
  }
}
```

---

## 7. Telegram

### Пример 7.1: Пост в канале

**Вход:** `https://t.me/telegram/123`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "telegram", "name": "Telegram" },
    "type": { "id": "channel_post", "name": "Пост в канале" },
    "ids": {
      "channel": "telegram",
      "post_id": 123
    },
    "url": {
      "normalized": "https://t.me/telegram/123"
    },
    "smm": {
      "available_services": ["views", "reactions"],
      "recommended": "views"
    }
  }
}
```

### Пример 7.2: Пригласительная ссылка

**Вход:** `https://t.me/+abc123DEF`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "telegram", "name": "Telegram" },
    "type": { "id": "invite", "name": "Пригласительная ссылка" },
    "ids": {
      "invite_code": "abc123DEF"
    },
    "url": {
      "normalized": "https://t.me/+abc123DEF"
    },
    "smm": {
      "available_services": ["members"],
      "recommended": "members",
      "note": "Ссылка добавляет пользователя в канал/группу"
    }
  }
}
```

---

## 8. WhatsApp

### Пример 8.1: Click to Chat

**Вход:** `https://wa.me/71234567890?text=Привет!`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "whatsapp", "name": "WhatsApp" },
    "type": { "id": "click_to_chat", "name": "Клик-чат" },
    "ids": {
      "phone": "71234567890"
    },
    "metadata": {
      "has_predefined_text": true,
      "text": "Привет!"
    },
    "url": {
      "normalized": "https://wa.me/71234567890"
    },
    "smm": {
      "available_services": [],
      "note": "WhatsApp не поддерживает SMM-услуги напрямую"
    }
  }
}
```

### Пример 8.2: Группа

**Вход:** `https://chat.whatsapp.com/XXXXXXXXXXXXXXXXXXXXXX`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "whatsapp", "name": "WhatsApp" },
    "type": { "id": "group", "name": "Группа" },
    "ids": {
      "invite_code": "XXXXXXXXXXXXXXXXXXXXXX"
    },
    "smm": {
      "available_services": ["members"],
      "recommended": "members"
    }
  }
}
```

---

## 9. Discord

### Пример 9.1: Приглашение

**Вход:** `https://discord.gg/abc123`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "discord", "name": "Discord" },
    "type": { "id": "invite", "name": "Приглашение" },
    "ids": {
      "invite_code": "abc123"
    },
    "url": {
      "normalized": "https://discord.gg/abc123"
    },
    "smm": {
      "available_services": ["members"],
      "recommended": "members"
    }
  }
}
```

---

## 10. LinkedIn

### Пример 10.1: Профиль

**Вход:** `https://www.linkedin.com/in/username/`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "linkedin", "name": "LinkedIn" },
    "type": { "id": "profile", "name": "Профиль" },
    "ids": {
      "username": "username"
    },
    "url": {
      "normalized": "https://linkedin.com/in/username"
    },
    "smm": {
      "available_services": ["followers"],
      "recommended": "followers"
    }
  }
}
```

### Пример 10.2: Компания

**Вход:** `https://linkedin.com/company/linkedin`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "linkedin", "name": "LinkedIn" },
    "type": { "id": "company", "name": "Страница компании" },
    "ids": {
      "company_name": "linkedin"
    },
    "smm": {
      "available_services": ["followers"],
      "recommended": "followers"
    }
  }
}
```

---

## 11. Reddit

### Пример 11.1: Пост

**Вход:** `https://www.reddit.com/r/programming/comments/abc123/title_text/`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "reddit", "name": "Reddit" },
    "type": { "id": "post", "name": "Пост" },
    "ids": {
      "subreddit": "programming",
      "post_id": "abc123"
    },
    "url": {
      "normalized": "https://reddit.com/r/programming/comments/abc123/title_text/"
    },
    "smm": {
      "available_services": ["upvotes", "comments"],
      "recommended": "upvotes"
    }
  }
}
```

---

## 12. Twitch

### Пример 12.1: Канал

**Вход:** `https://www.twitch.tv/ninja`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "twitch", "name": "Twitch" },
    "type": { "id": "channel", "name": "Канал" },
    "ids": {
      "channel_name": "ninja"
    },
    "url": {
      "normalized": "https://twitch.tv/ninja"
    },
    "smm": {
      "available_services": ["followers", "viewers"],
      "recommended": "followers"
    }
  }
}
```

### Пример 12.2: Клип

**Вход:** `https://clips.twitch.tv/ClipName-abc123`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "twitch", "name": "Twitch" },
    "type": { "id": "clip", "name": "Клип" },
    "ids": {
      "clip_slug": "ClipName-abc123"
    },
    "smm": {
      "available_services": ["views"],
      "recommended": "views"
    }
  }
}
```

---

## 13. Spotify

### Пример 13.1: Трек

**Вход:** `https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "spotify", "name": "Spotify" },
    "type": { "id": "track", "name": "Трек" },
    "ids": {
      "track_id": "4iV5W9uYEdYUVa79Axb7Rh"
    },
    "metadata": {
      "id_format": "base62",
      "id_length": 22
    },
    "smm": {
      "available_services": ["plays"],
      "recommended": "plays"
    }
  }
}
```

---

## 14. Threads

### Пример 14.1: Профиль

**Вход:** `https://www.threads.net/@zuck`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "threads", "name": "Threads" },
    "type": { "id": "profile", "name": "Профиль" },
    "ids": {
      "username": "zuck"
    },
    "url": {
      "normalized": "https://threads.net/@zuck"
    },
    "smm": {
      "available_services": ["followers"],
      "recommended": "followers"
    }
  }
}
```

---

## 15. Одноклассники (OK.ru)

### Пример 15.1: Группа

**Вход:** `https://ok.ru/group/123456789`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "ok", "name": "Одноклассники" },
    "type": { "id": "group", "name": "Группа" },
    "ids": {
      "group_id": "123456789"
    },
    "smm": {
      "available_services": ["members"],
      "recommended": "members"
    }
  }
}
```

### Пример 15.2: Видео

**Вход:** `https://ok.ru/video/123456789`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "ok", "name": "Одноклассники" },
    "type": { "id": "video", "name": "Видео" },
    "ids": {
      "video_id": "123456789"
    },
    "smm": {
      "available_services": ["views", "likes"],
      "recommended": "views"
    }
  }
}
```

---

## 16. Rutube

### Пример 16.1: Видео

**Вход:** `https://rutube.ru/video/abc123def456ghi789/`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "rutube", "name": "Rutube" },
    "type": { "id": "video", "name": "Видео" },
    "ids": {
      "video_id": "abc123def456ghi789"
    },
    "smm": {
      "available_services": ["views", "likes"],
      "recommended": "views"
    }
  }
}
```

---

## 17. Яндекс Дзен

### Пример 17.1: Статья

**Вход:** `https://dzen.ru/a/abc123def`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "dzen", "name": "Яндекс Дзен" },
    "type": { "id": "article", "name": "Статья" },
    "ids": {
      "article_id": "abc123def"
    },
    "smm": {
      "available_services": ["likes", "comments"],
      "recommended": "likes"
    }
  }
}
```

---

## 18. MAX

### Пример 18.1: Профиль

**Вход:** `https://max.ru/u/abc123xyz`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "max", "name": "MAX" },
    "type": { "id": "profile", "name": "Профиль" },
    "ids": {
      "user_code": "abc123xyz"
    },
    "smm": {
      "available_services": [],
      "note": "Новая платформа, SMM-услуги ограничены"
    }
  }
}
```

---

## 19. Обработка ошибок

### Пример 19.1: Неверный формат

**Вход:** `https://vk.com/invalid_format`

**Анализ:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FORMAT",
    "message": "Ссылка не соответствует ни одному из форматов VK",
    "platform": "vk",
    "expected_patterns": [
      "vk.com/id{user_id}",
      "vk.com/{screen_name}",
      "vk.com/wall{owner_id}_{post_id}",
      "vk.com/video{owner_id}_{video_id}",
      "..."
    ]
  }
}
```

### Пример 19.2: Неизвестная платформа

**Вход:** `https://unknown-platform.com/page/123`

**Анализ:**
```json
{
  "success": false,
  "error": {
    "code": "UNKNOWN_PLATFORM",
    "message": "Неподдерживаемая платформа",
    "domain": "unknown-platform.com",
    "supported_platforms": [
      "vk.com", "youtube.com", "instagram.com", "tiktok.com",
      "facebook.com", "x.com", "t.me", "..."
    ]
  }
}
```

### Пример 19.3: Deep Link

**Вход:** `tg://resolve?domain=telegram`

**Анализ:**
```json
{
  "success": true,
  "data": {
    "platform": { "id": "telegram", "name": "Telegram" },
    "type": { "id": "profile", "name": "Профиль" },
    "ids": {
      "username": "telegram"
    },
    "is_deep_link": true,
    "web_equivalent": "https://t.me/telegram",
    "warning": "Для SMM-услуг рекомендуется использовать веб-формат"
  }
}
```

---

## 20. Массовый анализ

### Пример 20.1: Пакетная обработка

**Вход:** Массив ссылок

```json
[
  "https://vk.com/wall-123_456",
  "https://instagram.com/p/abc123/",
  "https://tiktok.com/@user/video/123456789",
  "https://invalid-link"
]
```

**Анализ:**
```json
{
  "success": true,
  "results": [
    {
      "url": "https://vk.com/wall-123_456",
      "success": true,
      "platform": "vk",
      "type": "wall_post"
    },
    {
      "url": "https://instagram.com/p/abc123/",
      "success": true,
      "platform": "instagram",
      "type": "post"
    },
    {
      "url": "https://tiktok.com/@user/video/123456789",
      "success": true,
      "platform": "tiktok",
      "type": "video"
    },
    {
      "url": "https://invalid-link",
      "success": false,
      "error": "UNKNOWN_PLATFORM"
    }
  ],
  "summary": {
    "total": 4,
    "successful": 3,
    "failed": 1
  }
}
```

---

*Документ версии 3.0 от 2026-03-27*
