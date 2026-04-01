---
name: social-link-analyzer
description: Умный анализатор ссылок социальных сетей и мессенджеров. Автоматически определяет платформу, тип контента, извлекает ID, предоставляет инструкции по получению ссылок и правила для SMM-провайдеров. Поддерживает 35+ платформ.
version: 4.0.0
author: skill-creator
tags:
  - social-media
  - url-analysis
  - smm
  - provider-import
  - analyzer-rules
  - vk
  - youtube
  - telegram
  - instagram
  - tiktok
  - facebook
  - twitter
  - whatsapp
  - discord
  - linkedin
  - reddit
  - pinterest
  - snapchat
  - twitch
  - spotify
  - threads
  - odnoklassniki
  - rutube
  - dzen
  - max
  - likee
  - viber
  - wechat
  - line
  - douyin
  - weibo
  - bilibili
  - kuaishou
  - xiaohongshu
---

# Social Link Analyzer v4.0

Универсальный анализатор ссылок социальных сетей и мессенджеров для AI-агентов. Навык предоставляет:
- Автоматическое определение платформы и типа контента
- Извлечение идентификаторов и метаданных
- **Разрешение конфликтов через выбор пользователя**
- Правила для анализаторов и валидации
- Умный импорт от провайдеров SMM-услуг
- Полную информацию о структуре ссылок 35+ платформ

---

## Триггеры использования навыка

Используйте этот навык, когда пользователь:
- Предоставляет ссылку на контент в социальной сети или мессенджере
- Спрашивает о структуре и формате ссылок
- Работает с SMM-услугами (продвижение, накрутка)
- Нуждается в валидации или нормализации ссылок
- Настраивает импорт данных от провайдеров услуг
- Создаёт правила для автоматических анализаторов
- Просит определить тип объекта по ссылке

---

## Поддерживаемые платформы

### Международные соцсети
| Платформа | Домены | Статус |
|-----------|--------|--------|
| **ВКонтакте** | vk.com, m.vk.com, vk.me, vk.cc, live.vkvideo.ru | Полная поддержка |
| **YouTube** | youtube.com, youtu.be, youtube-nocookie.com, m.youtube.com | Полная поддержка |
| **Instagram** | instagram.com, instagr.am, ig.me | Полная поддержка |
| **TikTok** | tiktok.com, vm.tiktok.com | Полная поддержка |
| **Facebook** | facebook.com, fb.com, fb.watch, fb.me | Полная поддержка |
| **X (Twitter)** | x.com, twitter.com, t.co | Полная поддержка |
| **LinkedIn** | linkedin.com, linkedin.cn | Полная поддержка |
| **Pinterest** | pinterest.com, pin.it | Полная поддержка |
| **Reddit** | reddit.com, redd.it, old.reddit.com | Полная поддержка |
| **Snapchat** | snapchat.com, snap.com | Полная поддержка |
| **Twitch** | twitch.tv, clips.twitch.tv | Полная поддержка |
| **Threads** | threads.net | Полная поддержка |
| **Spotify** | spotify.com, open.spotify.com, spoti.fi | Полная поддержка |

### Азиатские платформы
| Платформа | Домены | Статус |
|-----------|--------|--------|
| **Douyin (китайский TikTok)** | douyin.com, v.douyin.com, iesdouyin.com | Полная поддержка |
| **Sina Weibo** | weibo.com, weibo.cn, t.sina.com.cn | Полная поддержка |
| **Bilibili** | bilibili.com, b23.tv, acgvideo.com | Полная поддержка |
| **Kuaishou/Kwai** | kuaishou.com, kwai.com, gifshow.com | Полная поддержка |
| **Xiaohongshu (Little Red Book)** | xiaohongshu.com, xhslink.com | Базовая поддержка |

### Мессенджеры
| Платформа | Домены | Статус |
|-----------|--------|--------|
| **Telegram** | t.me, telegram.me, tg:// | Полная поддержка |
| **WhatsApp** | wa.me, api.whatsapp.com, chat.whatsapp.com | Полная поддержка |
| **Discord** | discord.com, discord.gg, discordapp.com | Полная поддержка |
| **Viber** | viber.com, vb.me, viber:// | Полная поддержка |
| **WeChat** | wechat.com, weixin.qq.com | Базовая поддержка |
| **Line** | line.me, line:// | Базовая поддержка |
| **MAX** | max.ru, web.max.ru, botapi.max.ru | Полная поддержка |

### Российские платформы
| Платформа | Домены | Статус |
|-----------|--------|--------|
| **Одноклассники** | ok.ru, m.ok.ru | Полная поддержка |
| **Rutube** | rutube.ru, rutube.video | Полная поддержка |
| **Яндекс Дзен** | dzen.ru, zen.yandex.ru | Полная поддержка |
| **Likee** | likee.com, likee.video | Базовая поддержка |

---

## ⚠️ Разрешение конфликтов

Некоторые ссылки невозможно однозначно классифицировать без дополнительной информации. В таких случаях навык возвращает **ambiguity** и предлагает варианты выбора.

### Конфликтные ситуации

#### 1. VK: Профиль vs Группа по короткому имени

```
Ссылка: vk.com/aprilclub

Это может быть:
├── Профиль пользователя
└── Сообщество/группа

Решение: Запросить у пользователя уточнение
```

**Ответ навыка:**
```json
{
  "status": "ambiguity",
  "platform": "vk",
  "url": "https://vk.com/aprilclub",
  "ids": {
    "screen_name": "aprilclub"
  },
  "ambiguity": {
    "type": "vk_screen_name",
    "message": "Не удалось определить: профиль пользователя или сообщество",
    "options": [
      {
        "id": "profile",
        "label": "Профиль пользователя",
        "description": "Личная страница пользователя ВКонтакте",
        "smm_services": ["followers", "friends"]
      },
      {
        "id": "group",
        "label": "Сообщество/группа",
        "description": "Группа, публичная страница или мероприятие",
        "smm_services": ["members", "friends"]
      }
    ],
    "how_to_check": [
      "Откройте ссылку в браузере",
      "Профиль показывает: 'Подписчики' и 'Друзья'",
      "Группа показывает: 'Участники' и тип (группа/паблик/мероприятие)",
      "Группы имеют ID с префиксом club/public/event"
    ]
  }
}
```

#### 2. Facebook: Профиль vs Страница

```
Ссылка: facebook.com/zuck

Это может быть:
├── Профиль пользователя
└── Страница (Page)

Решение: Запросить у пользователя уточнение
```

**Ответ навыка:**
```json
{
  "status": "ambiguity",
  "platform": "facebook",
  "ambiguity": {
    "type": "fb_profile_page",
    "message": "Не удалось определить: профиль или страница",
    "options": [
      {
        "id": "profile",
        "label": "Профиль пользователя",
        "description": "Личный профиль Facebook",
        "smm_services": ["followers"]
      },
      {
        "id": "page",
        "label": "Страница (Fan Page)",
        "description": "Публичная страница бренда, компании или личности",
        "smm_services": ["followers", "likes"]
      }
    ],
    "how_to_check": [
      "Профиль: URL может быть facebook.com/profile.php?id=...",
      "Страница: Показывает 'Нравится' и 'Подписчики' отдельно",
      "Страницы могут иметь кнопку 'Сообщение'",
      "Профили показывают 'Добавить в друзья'"
    ]
  }
}
```

#### 3. Telegram: Канал vs Группа vs Бот

```
Ссылка: t.me/username

Это может быть:
├── Канал (Channel)
├── Группа (Group)
└── Бот (Bot)

Решение: Запросить у пользователя уточнение
```

**Ответ навыка:**
```json
{
  "status": "ambiguity",
  "platform": "telegram",
  "ambiguity": {
    "type": "tg_entity_type",
    "message": "Не удалось определить тип: канал, группа или бот",
    "options": [
      {
        "id": "channel",
        "label": "Канал",
        "description": "Канал для вещания контента",
        "smm_services": ["members", "post_views", "reactions"]
      },
      {
        "id": "group",
        "label": "Группа/Чат",
        "description": "Групповой чат для общения",
        "smm_services": ["members"]
      },
      {
        "id": "bot",
        "label": "Бот",
        "description": "Telegram бот",
        "smm_services": [],
        "hint": "Боты обычно имеют 'bot' в конце имени"
      }
    ],
    "how_to_check": [
      "Канал: показывает 'Подписаться', посты от имени канала",
      "Группа: показывает участников, сообщения от всех",
      "Бот: показывает кнопку 'Запустить' или 'Start'",
      "Боты часто имеют имя оканчивающееся на 'bot'"
    ]
  }
}
```

#### 4. Instagram: Пост vs Reels vs IGTV

```
Ссылка: instagram.com/p/CgBxesYIjZ/

Примечание: /p/ может быть постом ИЛИ Reels
Reels также доступны через /reel/ URL

Решение: Проверить контент или запросить уточнение
```

---

## Платформа 1: ВКОНТАКТЕ (VK)

### Домены
```
Основные:     vk.com, m.vk.com
Мессенджер:   vk.me
Сокращатель:  vk.cc
Видео:        live.vkvideo.ru
```

### Форматы ссылок

#### Профиль пользователя (однозначные форматы)
```
vk.com/id1                    — по числовому ID (однозначно)
vk.com/durov                  — по короткому имени (может быть группой!)
```

#### Сообщество (однозначные форматы)
```
vk.com/club22884714           — группа по ID (однозначно)
vk.com/public123456           — публичная страница (однозначно)
vk.com/event123456            — мероприятие/встреча (однозначно)
```

⚠️ **Важно:** Короткое имя сообщества (например, `vk.com/aprilclub`) может совпадать с форматом профиля пользователя. Используйте префиксные формы для однозначного определения.

#### Пост (запись на стене)
```
vk.com/wall-22884714_12345
```
**Формат:** `wall{owner_id}_{post_id}`
- `owner_id` отрицательный = сообщество
- `owner_id` положительный = пользователь

#### Медиа-контент
```
vk.com/photo-22884714_457654321      — фотография
vk.com/video-22884714_456239687      — видеозапись
vk.com/clip-22884714_456239487       — VK Клип
vk.com/audio-2001234567_1234567      — аудиозапись
vk.com/album-22884714_9876543        — фотоальбом
vk.com/product-12345678_9876543      — товар
vk.com/topic-22884714_39827145       — обсуждение
vk.com/@aprilclub/kak-rabotat        — статья
vk.com/market-22884714               — раздел товаров
vk.com/board-22884714                — обсуждения
```

#### Комментарий
```
vk.com/wall-22884714_12345?reply=67890
vk.com/wall-22884714_12345?reply=67890&thread=11111
```

#### Чаты и сообщения
```
vk.me/durov                                     — личные сообщения
vk.me/club22884714                              — сообщения сообщества
https://vk.me/join/AJQ1d2EyrX8/P2tF6sL7k2xE    — приглашение в беседу
```

### Регулярные выражения (исправленные)

```regex
# Однозначный профиль по ID
Профиль ID:      ^https?://(?:m\.)?vk\.com/id(\d+)$

# Группы по ID (однозначно)
Группа:          ^https?://(?:m\.)?vk\.com/(club|public|event)(\d+)$

# Неоднозначный screen_name (требует проверки)
Screen name:     ^https?://(?:m\.)?vk\.com/([a-zA-Z][a-zA-Z0-9_.]{1,31})$

# Пост (однозначно)
Пост:            ^https?://(?:m\.)?vk\.com/wall(-?\d+)_(\d+)$

# Фото/Видео/Клип (однозначно)
Фото:            ^https?://(?:m\.)?vk\.com/photo(-?\d+)_(\d+)$
Видео:           ^https?://(?:m\.)?vk\.com/video(-?\d+)_(\d+)$
Клип:            ^https?://(?:m\.)?vk\.com/clip(-?\d+)_(\d+)$

# Комментарий (однозначно)
Комментарий:     ^https?://(?:m\.)?vk\.com/wall(-?\d+)_(\d+)\?reply=(\d+)
```

### SMM-услуги VK
| Услуга | Требуемый тип ссылки | Пример |
|--------|---------------------|--------|
| Подписчики | Профиль/сообщество | `vk.com/aprilclub` |
| Лайки | Пост/фото/видео | `vk.com/wall-123_456` |
| Просмотры видео | Видео | `vk.com/video-123_456` |
| Просмотры клипов | Клип | `vk.com/clip-123_456` |
| Комментарии | Пост/фото/видео | `vk.com/wall-123_456` |
| Репосты | Пост/фото/видео | `vk.com/wall-123_456` |
| Голоса в опросе | Пост с опросом | `vk.com/wall-123_456` |

---

## Платформа 2: YOUTUBE

### Домены
```
Основные:      youtube.com, www.youtube.com, m.youtube.com
Короткие:      youtu.be
Embed:         youtube-nocookie.com
```

### Форматы ссылок

#### Канал (однозначно)
```
youtube.com/@username                          — современный формат
youtube.com/c/username                         — устаревший формат
youtube.com/channel/UC...                      — по Channel ID
```

#### Видео (однозначно)
```
youtube.com/watch?v=VIDEO_ID                   — стандартный формат
youtu.be/VIDEO_ID                              — короткая ссылка
youtube.com/shorts/VIDEO_ID                    — Shorts
youtube.com/live/VIDEO_ID                      — прямой эфир
```

#### Плейлист
```
youtube.com/playlist?list=PLAYLIST_ID
youtube.com/watch?v=VIDEO_ID&list=PLAYLIST_ID
```

#### Другие объекты
```
youtube.com/clip/CLIP_ID                       — клип (фрагмент видео)
youtube.com/post/POST_ID                       — пост сообщества
youtube.com/watch?v=ID&t=90                    — с тайм-кодом
youtube.com/watch?v=ID&lc=COMMENT_ID           — комментарий
```

### Регулярные выражения
```regex
Видео стандарт:  ^https?://(?:www\.)?youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})$
Видео короткий:  ^https?://youtu\.be/([a-zA-Z0-9_-]{11})$
Shorts:          ^https?://(?:www\.)?youtube\.com/shorts/([a-zA-Z0-9_-]{11})$
Live:            ^https?://(?:www\.)?youtube\.com/live/([a-zA-Z0-9_-]{11})$
Канал @:         ^https?://(?:www\.)?youtube\.com/@([a-zA-Z0-9_.-]+)$
Канал ID:        ^https?://(?:www\.)?youtube\.com/channel/(UC[a-zA-Z0-9_-]{22})$
Плейлист:        ^https?://(?:www\.)?youtube\.com/playlist\?list=([a-zA-Z0-9_-]+)$
```

### SMM-услуги YouTube
| Услуга | Требуемый тип ссылки |
|--------|---------------------|
| Подписчики | `youtube.com/@username` |
| Просмотры | `youtube.com/watch?v=VIDEO_ID` |
| Лайки | `youtube.com/watch?v=VIDEO_ID` |
| Комментарии | `youtube.com/watch?v=VIDEO_ID` |
| Просмотры Shorts | `youtube.com/shorts/VIDEO_ID` |

---

## Платформа 3: INSTAGRAM

### Домены
```
Основные:   instagram.com, www.instagram.com
Короткие:   instagr.am
Сообщения:  ig.me
```

### Форматы ссылок

#### Профиль (однозначно)
```
instagram.com/username
www.instagram.com/username/
```

#### Контент
```
instagram.com/p/CgBxesYIjZ/          — пост (может быть Reels!)
instagram.com/reel/CgBxesYIjZ/       — Reels (однозначно)
instagram.com/tv/CgBxesYIjZ/         — IGTV
instagram.com/stories/username/123/  — Stories (время действия 24ч)
instagram.com/stories/highlights/1234567890123456789/  — Highlights (исправлено!)
```

#### Навигация
```
instagram.com/explore/tags/fashion/          — хэштег
instagram.com/explore/locations/123456789/   — геотег
```

#### Direct
```
ig.me/m/username                     — открыть диалог
ig.me/m/username?text=Hello          — с предзаполненным текстом (URL-encoded!)
```

### Регулярные выражения (исправленные)
```regex
Профиль:         ^https?://(?:www\.)?instagram\.com/([a-zA-Z0-9_.]+)/?$
Пост:            ^https?://(?:www\.)?instagram\.com/p/([a-zA-Z0-9_-]+)/?$
Reels:           ^https?://(?:www\.)?instagram\.com/reel/([a-zA-Z0-9_-]+)/?$
IGTV:            ^https?://(?:www\.)?instagram\.com/tv/([a-zA-Z0-9_-]+)/?$
Stories:         ^https?://(?:www\.)?instagram\.com/stories/([a-zA-Z0-9_.]+)/(\d+)/?$
Highlights:      ^https?://(?:www\.)?instagram\.com/stories/highlights/(\d+)/?$
Хэштег:          ^https?://(?:www\.)?instagram\.com/explore/tags/([^/]+)/?$
```

### SMM-услуги Instagram
| Услуга | Требуемый тип ссылки |
|--------|---------------------|
| Подписчики | `instagram.com/username` |
| Лайки (пост) | `instagram.com/p/XXXXXXX/` |
| Лайки/просмотры (Reels) | `instagram.com/reel/XXXXXXX/` |
| Комментарии | `instagram.com/p/XXXXXXX/` |
| Сохранения | `instagram.com/p/XXXXXXX/` |

---

## Платформа 4: TIKTOK

### Домены
```
Основные:     tiktok.com, www.tiktok.com
Сокращённые:  vm.tiktok.com
```

### Форматы ссылок

#### Профиль
```
tiktok.com/@username
www.tiktok.com/@username
```

#### Видео
```
tiktok.com/@username/video/VIDEO_ID          — полный формат
tiktok.com/VIDEO_ID                           — короткий формат
vm.tiktok.com/XXXXXX/                         — сокращённая ссылка (требует раскрытия)
```

#### Другое
```
tiktok.com/tag/fyp                            — хэштег
tiktok.com/music/original-sound-MUSIC_ID      — музыка/звук
tiktok.com/@username/live                     — трансляция
tiktok.com/product/PRODUCT_ID                 — товар (Shop)
tiktok.com/@username/shop                     — магазин
```

### Регулярные выражения
```regex
Профиль:         ^https?://(?:www\.)?tiktok\.com/@([a-zA-Z0-9_.]+)/?$
Видео:           ^https?://(?:www\.)?tiktok\.com/@([a-zA-Z0-9_.]+)/video/(\d+)$
Видео короткий:  ^https?://(?:www\.)?tiktok\.com/(\d+)/?$
Хэштег:          ^https?://(?:www\.)?tiktok\.com/tag/([^/]+)/?$
Музыка:          ^https?://(?:www\.)?tiktok\.com/music/[^/]+-(\d+)$
Live:            ^https?://(?:www\.)?tiktok\.com/@([a-zA-Z0-9_.]+)/live/?$
```

### SMM-услуги TikTok
| Услуга | Требуемый тип ссылки |
|--------|---------------------|
| Подписчики | `tiktok.com/@example` |
| Просмотры/лайки | `tiktok.com/@example/video/123...` |
| Комментарии | `tiktok.com/@example/video/123...` |
| Зрители Live | `tiktok.com/@example/live` |

---

## Платформа 5: DOUYIN (китайский TikTok)

### Домены
```
Основные:     douyin.com, www.douyin.com
Сокращённые:  v.douyin.com, iesdouyin.com
```

### Форматы ссылок

#### Профиль
```
douyin.com/user/MS4wLjABAAAA...              — по ID
douyin.com/@username                          — по имени
```

#### Видео
```
douyin.com/video/1234567890123456             — видео по ID
v.douyin.com/XXXXXX/                          — сокращённая ссылка
```

#### Другое
```
douyin.com/hot/123                            — горячая тема
douyin.com/music/123                          — музыка
douyin.com/note/123                           — заметка
```

### Регулярные выражения
```regex
Профиль ID:      ^https?://(?:www\.)?douyin\.com/user/([a-zA-Z0-9_-]+)$
Профиль имя:     ^https?://(?:www\.)?douyin\.com/@([a-zA-Z0-9_.]+)$
Видео:           ^https?://(?:www\.)?douyin\.com/video/(\d+)$
Сокращённая:     ^https?://v\.douyin\.com/([a-zA-Z0-9]+)/?$
```

### SMM-услуги Douyin
| Услуга | Требуемый тип ссылки |
|--------|---------------------|
| Подписчики | `douyin.com/user/XXX` |
| Просмотры/лайки | `douyin.com/video/XXX` |

---

## Платформа 6: SINA WEIBO

### Домены
```
Основные:     weibo.com, www.weibo.com
Альтернатива: weibo.cn, t.sina.com.cn
```

### Форматы ссылок

#### Профиль
```
weibo.com/u/1234567890                       — профиль по UID
weibo.com/username                           — профиль по имени
weibo.cn/u/1234567890                        — мобильная версия
```

#### Пост
```
weibo.com/1234567890/Oabcdefg                — пост
weibo.com/ttarticle/p/show?id=123            — статья
```

#### Другое
```
weibo.com/p/100101123456                     — страница
weibo.com/hot/search                         — горячий поиск
```

### Регулярные выражения
```regex
Профиль UID:     ^https?://(?:www\.)?weibo\.com/u/(\d+)$
Профиль имя:     ^https?://(?:www\.)?weibo\.com/([a-zA-Z0-9_]+)$
Пост:            ^https?://(?:www\.)?weibo\.com/(\d+)/([a-zA-Z0-9]+)$
Статья:          ^https?://(?:www\.)?weibo\.com/ttarticle/p/show\?id=(\d+)$
```

### SMM-услуги Weibo
| Услуга | Требуемый тип ссылки |
|--------|---------------------|
| Подписчики | `weibo.com/u/XXX` |
| Лайки/репосты | `weibo.com/XXX/YYY` |

---

## Платформа 7: BILIBILI

### Домены
```
Основные:     bilibili.com, www.bilibili.com
Короткие:     b23.tv
Медиа:        acgvideo.com, bilivideo.com
```

### Форматы ссылок

#### Профиль
```
space.bilibili.com/12345678                  — пространство пользователя
bilibili.com/member/index.php?mid=12345678   — старый формат
```

#### Видео
```
bilibili.com/video/BV1xx411c7mD              — BV ID (новый формат)
bilibili.com/video/av12345678                — AV ID (старый формат)
b23.tv/BV1xx411c7mD                          — короткая ссылка
```

#### Другое
```
bilibili.com/bangumi/play/ep12345            — аниме/сериал
bilibili.com/cheese/play/ss123               — курс
bilibili.com/read/cv123456                   — статья
bilibili.com/audio/au123456                  — аудио
```

### Регулярные выражения
```regex
Профиль:         ^https?://space\.bilibili\.com/(\d+)$
Видео BV:        ^https?://(?:www\.)?bilibili\.com/video/(BV[a-zA-Z0-9]+)$
Видео AV:        ^https?://(?:www\.)?bilibili\.com/video/av(\d+)$
Короткая:        ^https?://b23\.tv/(BV[a-zA-Z0-9]+)$
Бангами:         ^https?://(?:www\.)?bilibili\.com/bangumi/play/ep(\d+)$
Статья:          ^https?://(?:www\.)?bilibili\.com/read/cv(\d+)$
```

### SMM-услуги Bilibili
| Услуга | Требуемый тип ссылки |
|--------|---------------------|
| Подписчики | `space.bilibili.com/XXX` |
| Просмотры | `bilibili.com/video/BVXXX` |
| Лайки | `bilibili.com/video/BVXXX` |

---

## Платформа 8: FACEBOOK

### Домены
```
Основные:     facebook.com, www.facebook.com, m.facebook.com
Короткие:     fb.com, fb.me, fb.watch
```

### Форматы ссылок

#### Профиль (форматы)
```
facebook.com/profile.php?id=123456789         — по числовому ID (однозначно)
facebook.com/zuck                              — по имени (профиль ИЛИ страница!)
```

#### Страница (форматы)
```
facebook.com/PageName                         — по имени страницы
facebook.com/pages/PageName/123456789         — старый формат (однозначно)
```

⚠️ **Важно:** Ссылка `facebook.com/Name` может быть как профилем, так и страницей. Используйте `profile.php?id=` для однозначного профиля или `pages/` для однозначной страницы.

#### Группа
```
facebook.com/groups/123456789                 — по ID группы
facebook.com/groups/GroupName                 — по имени группы
```

#### Контент
```
facebook.com/username/posts/123456789         — пост
facebook.com/username/videos/123456789        — видео
facebook.com/watch/?v=123456789               — видео через Watch
facebook.com/reel/123456789                   — Reels
facebook.com/story.php?story_fbid=123&id=456  — история
```

### Регулярные выражения (исправленные)
```regex
Профиль ID:      ^https?://(?:www\.)?facebook\.com/profile\.php\?id=(\d+)$
Страница ID:     ^https?://(?:www\.)?facebook\.com/pages/[^/]+/(\d+)$
Имя (неоднозначно): ^https?://(?:www\.)?facebook\.com/([a-zA-Z0-9.]{5,50})/?$
Группа:          ^https?://(?:www\.)?facebook\.com/groups/([^/]+)/?$
Пост:            ^https?://(?:www\.)?facebook\.com/([^/]+)/posts/(\d+)$
Видео:           ^https?://(?:www\.)?facebook\.com/([^/]+)/videos/(\d+)$
Reels:           ^https?://(?:www\.)?facebook\.com/reel/(\d+)$
Watch:           ^https?://(?:www\.)?facebook\.com/watch/\?v=(\d+)$
```

### SMM-услуги Facebook
| Услуга | Требуемый тип ссылки |
|--------|---------------------|
| Подписчики страницы | `facebook.com/PageName` (как страницу) |
| Лайки поста | `facebook.com/username/posts/123` |
| Лайки видео | `facebook.com/username/videos/123` |
| Просмотры видео | `facebook.com/watch/?v=123` |
| Члены группы | `facebook.com/groups/123456789` |

---

## Платформа 9: X (TWITTER)

### Домены
```
Основные:   x.com, twitter.com
Сокращённые: t.co
```

### Форматы ссылок

#### Профиль
```
x.com/username
twitter.com/username
```

#### Пост (твит)
```
x.com/username/status/1234567890123456
twitter.com/username/status/1234567890123456
```

#### Spaces
```
x.com/i/spaces/XXXXXX                              — аудио-пространство
```

### Регулярные выражения
```regex
Профиль X:       ^https?://x\.com/([a-zA-Z0-9_]{1,15})/?$
Профиль Twitter: ^https?://twitter\.com/([a-zA-Z0-9_]{1,15})/?$
Пост X:          ^https?://x\.com/([a-zA-Z0-9_]{1,15})/status/(\d+)$
Пост Twitter:    ^https?://twitter\.com/([a-zA-Z0-9_]{1,15})/status/(\d+)$
Spaces:          ^https?://x\.com/i/spaces/([a-zA-Z0-9]+)$
```

### SMM-услуги X/Twitter
| Услуга | Требуемый тип ссылки |
|--------|---------------------|
| Подписчики | `x.com/username` |
| Лайки | `x.com/username/status/123...` |
| Ретвиты | `x.com/username/status/123...` |
| Просмотры | `x.com/username/status/123...` |

---

## Платформа 10: TELEGRAM

### Домены
```
Основные:    t.me, telegram.me
Deep links:  tg://
```

### Форматы ссылок

#### Публичные объекты
```
t.me/username                           — профиль/канал/группа/бот (неоднозначно!)
t.me/channelname/123                    — пост в канале (однозначно канал)
t.me/chatname                           — публичная группа (неоднозначно!)
t.me/botname                            — бот (часто с 'bot' в имени)
t.me/channelname/123?comment=456        — комментарий к посту
t.me/c/1234567890/123                   — сообщение в приватном чате
```

⚠️ **Важно:** Ссылка `t.me/username` может быть каналом, группой, ботом или профилем. Если имя оканчивается на 'bot', это скорее всего бот.

#### Пригласительные ссылки (однозначно)
```
t.me/joinchat/UVW1l84hDzM5M2Iy          — пригласительная ссылка
t.me/+abc123DEF                         — короткий формат приглашения
```

#### Deep links для ботов
```
t.me/MyBot?start=user123                — стартовый параметр
t.me/MyBot?startgroup                   — добавление в группу
```

### Регулярные выражения
```regex
Пост канала:     ^https?://t\.me/([a-zA-Z][a-zA-Z0-9_]{4,31})/(\d+)$
Комментарий:     ^https?://t\.me/([a-zA-Z][a-zA-Z0-9_]{4,31})/(\d+)\?comment=(\d+)$
Приватный пост:  ^https?://t\.me/c/(\d+)/(\d+)$
Присоединиться:  ^https?://t\.me/\+([a-zA-Z0-9_-]+)$
Joinchat:        ^https?://t\.me/joinchat/([a-zA-Z0-9_-]+)$
Имя (неоднозначно): ^https?://t\.me/([a-zA-Z][a-zA-Z0-9_]{4,31})/?$
```

### SMM-услуги Telegram
| Услуга | Требуемый тип ссылки |
|--------|---------------------|
| Подписчики канала | `t.me/channelname` (как канал) |
| Участники группы | `t.me/chatname` (как группа) |
| Просмотры поста | `t.me/channelname/123` |
| Реакции | `t.me/channelname/123` |

---

## Платформа 11: WHATSAPP

### Домены
```
Клик-чат:    wa.me, api.whatsapp.com
Группы:      chat.whatsapp.com
Deep links:  whatsapp://
```

### Форматы ссылок

#### Клик-чат (Click to Chat)
```
wa.me/71234567890                        — открыть чат с номером
wa.me/71234567890?text=Hello%20World     — с текстом (URL-encoded!)
api.whatsapp.com/send?phone=71234567890  — альтернативный формат
```

⚠️ **Важно:** Параметр `text` должен быть URL-encoded. Пробел = `%20`, кириллица = `%D0%9F%D1%80%D0%B8%D0%B2%D0%B5%D1%82`.

#### Группы
```
chat.whatsapp.com/XXXXXXXXXXXXXXXXXX     — приглашение в группу (22 символа)
```

### Регулярные выражения
```regex
Клик-чат:        ^https?://wa\.me/(\d+)$
С текстом:       ^https?://wa\.me/(\d+)\?text=(.+)$
Группа:          ^https?://chat\.whatsapp\.com/([a-zA-Z0-9]{22})$
API формат:      ^https?://api\.whatsapp\.com/send\?phone=(\d+)$
```

### SMM-услуги WhatsApp
| Услуга | Требуемый тип ссылки |
|--------|---------------------|
| Участники группы | `chat.whatsapp.com/XXX...` |

---

## Платформа 12: DISCORD

### Домены
```
Основные:     discord.com, discord.gg, discordapp.com
```

### Форматы ссылок

#### Приглашения
```
discord.gg/abc123                         — приглашение на сервер
discord.com/invite/abc123                 — альтернативный формат
```

#### Серверы и каналы
```
discord.com/channels/123456789012345678   — сервер по ID
discord.com/channels/123456789012345678/987654321098765432   — канал
```

### Регулярные выражения
```regex
Приглашение:     ^https?://(?:discord\.gg|discord\.com/invite)/([a-zA-Z0-9-]{2,30})/?$
Сервер:          ^https?://discord\.com/channels/(\d+)$
Канал:           ^https?://discord\.com/channels/(\d+)/(\d+)$
```

### SMM-услуги Discord
| Услуга | Требуемый тип ссылки |
|--------|---------------------|
| Участники сервера | `discord.gg/abc123` |

---

## Платформа 13: SPOTIFY

### Домены
```
Основные:     spotify.com, open.spotify.com
Короткие:     spoti.fi
```

### Форматы ссылок

#### Профиль
```
open.spotify.com/user/username            — профиль пользователя
open.spotify.com/artist/ArtistID          — страница артиста
```

#### Контент
```
open.spotify.com/track/TrackID            — трек
open.spotify.com/album/AlbumID            — альбом
open.spotify.com/playlist/PlaylistID      — плейлист
open.spotify.com/episode/EpisodeID        — эпизод подкаста
open.spotify.com/show/ShowID              — подкаст
```

#### URI формат (с $ в конце!)
```
spotify:track:TrackID$
spotify:album:AlbumID$
```

### Регулярные выражения (исправленные)
```regex
Трек:            ^https?://open\.spotify\.com/track/([a-zA-Z0-9]{22})$
Альбом:          ^https?://open\.spotify\.com/album/([a-zA-Z0-9]{22})$
Плейлист:        ^https?://open\.spotify\.com/playlist/([a-zA-Z0-9]{22})$
Артист:          ^https?://open\.spotify\.com/artist/([a-zA-Z0-9]{22})$
URI:             ^spotify:(track|album|playlist|artist|episode|show):([a-zA-Z0-9]{22})$
```

---

## Платформа 14-35: Остальные платформы

Подробная информация о платформах LinkedIn, Pinterest, Reddit, Snapchat, Twitch, Threads, Одноклассники, Rutube, Яндекс Дзен, MAX, Likee, Viber, WeChat, Line, Kuaishou, Xiaohongshu доступна в файле `platform-mapping.json`.

---

## АЛГОРИТМ АНАЛИЗА ССЫЛКИ

### Шаг 1: Определение платформы

```
Домен → Платформа:

vk.com, m.vk.com, vk.me, vk.cc        → ВКонтакте
youtube.com, youtu.be                  → YouTube
instagram.com, instagr.am, ig.me       → Instagram
tiktok.com, vm.tiktok.com              → TikTok
douyin.com, v.douyin.com               → Douyin
weibo.com, weibo.cn                    → Weibo
bilibili.com, b23.tv                   → Bilibili
facebook.com, fb.com, fb.watch         → Facebook
x.com, twitter.com, t.co               → X (Twitter)
t.me, telegram.me, tg://               → Telegram
wa.me, chat.whatsapp.com               → WhatsApp
discord.com, discord.gg                → Discord
linkedin.com                           → LinkedIn
pinterest.com, pin.it                  → Pinterest
reddit.com, redd.it                    → Reddit
snapchat.com                           → Snapchat
twitch.tv                              → Twitch
open.spotify.com                       → Spotify
threads.net                            → Threads
ok.ru                                  → Одноклассники
rutube.ru                              → Rutube
dzen.ru, zen.yandex.ru                 → Яндекс Дзен
max.ru                                 → MAX
likee.com                              → Likee
viber.com, vb.me, viber://             → Viber
line.me                                → Line
kuaishou.com, kwai.com                 → Kuaishou
xiaohongshu.com, xhslink.com           → Xiaohongshu
```

### Шаг 2: Проверка на однозначность

Для каждой платформы проверить, является ли формат однозначным:

- **Однозначные форматы** — сразу возвращаем результат
- **Неоднозначные форматы** — возвращаем `status: "ambiguity"` с вариантами выбора

### Шаг 3: Извлечение идентификаторов

Применить соответствующее регулярное выражение.

### Шаг 4: Нормализация

- Удалить `www.` префикс
- Удалить `m.` префикс мобильных версий
- Удалить trailing slash
- Удалить UTM-параметры
- Привести к каноническому формату

---

## ФОРМАТ ОТВЕТА

### Успешный анализ (однозначный)

```json
{
  "status": "success",
  "platform": {
    "id": "vk",
    "name": "ВКонтакте",
    "category": "social_network"
  },
  "url": {
    "original": "https://m.vk.com/wall-22884714_12345",
    "normalized": "https://vk.com/wall-22884714_12345"
  },
  "type": {
    "id": "wall_post",
    "name": "Пост на стене",
    "ambiguous": false
  },
  "ids": {
    "owner_id": -22884714,
    "post_id": 12345
  },
  "smm": {
    "available_services": ["likes", "comments", "reposts"],
    "recommended": "likes"
  }
}
```

### Неоднозначный анализ

```json
{
  "status": "ambiguity",
  "platform": {
    "id": "vk",
    "name": "ВКонтакте"
  },
  "url": {
    "original": "https://vk.com/aprilclub",
    "normalized": "https://vk.com/aprilclub"
  },
  "ids": {
    "screen_name": "aprilclub"
  },
  "ambiguity": {
    "type": "vk_screen_name",
    "message": "Не удалось определить: профиль пользователя или сообщество",
    "options": [
      {
        "id": "profile",
        "label": "Профиль пользователя",
        "description": "Личная страница",
        "smm_services": ["followers", "friends"]
      },
      {
        "id": "group",
        "label": "Сообщество/группа",
        "description": "Группа, паблик или мероприятие",
        "smm_services": ["members"]
      }
    ],
    "how_to_check": [
      "Откройте ссылку в браузере",
      "Профиль: 'Подписчики' и 'Друзья'",
      "Группа: 'Участники' и тип сообщества"
    ]
  }
}
```

### Ошибка

```json
{
  "status": "error",
  "error": {
    "code": "UNKNOWN_PLATFORM",
    "message": "Неподдерживаемая платформа",
    "domain": "unknown-site.com"
  }
}
```

---

## ИНТЕГРАЦИИ

Навык может использоваться совместно с:
- **web-search** — для поиска информации о контенте
- **web-reader** — для извлечения данных со страницы
- **xlsx** — для массовой обработки ссылок из таблиц
- **docx** — для создания отчётов по анализу

---

## ОБНОВЛЕНИЯ

| Версия | Дата | Изменения |
|--------|------|-----------|
| 1.0.0 | 2026-03 | Базовая поддержка VK, YouTube, Telegram, MAX, Likee |
| 2.0.0 | 2026-03 | Добавлена поддержка Instagram и TikTok |
| 3.0.0 | 2026-03 | Добавлено 18 новых платформ, правила анализаторов, SMM импорт |
| 4.0.0 | 2026-03 | Исправлены критические ошибки, добавлен механизм выбора для конфликтов, добавлены азиатские платформы (Douyin, Weibo, Bilibili, Kuaishou, Xiaohongshu) |

---

*Документ версии 4.0.0 от 2026-03-27*
