# Правила для анализаторов ссылок

Документ содержит формализованные правила для создания автоматических анализаторов ссылок социальных сетей и мессенджеров.

---

## 1. Архитектура анализатора

### 1.1 Компоненты системы

```
┌─────────────────────────────────────────────────────────────┐
│                    АНАЛИЗАТОР ССЫЛОК                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐  │
│  │  Ввод    │──▶│ Парсинг  │──▶│ Валидация│──▶│ Извлечение│  │
│  │  URL     │   │   URL    │   │          │   │    ID    │  │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘  │
│                                      │                       │
│                                      ▼                       │
│                              ┌──────────┐                   │
│                              │Определение│                  │
│                              │ платформы │                  │
│                              └──────────┘                   │
│                                      │                       │
│                                      ▼                       │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐  │
│  │  Вывод   │◀──│Нормализ. │◀──│Классифик.│◀──│  Мэппинг │  │
│  │  JSON    │   │          │   │  типа    │   │  услуг   │  │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Поток данных

1. **Input** — исходная ссылка (строка)
2. **Parse** — разбор URL на компоненты (scheme, host, path, query)
3. **Validate** — проверка корректности формата
4. **Detect Platform** — определение платформы по домену
5. **Extract IDs** — извлечение идентификаторов через regex
6. **Classify Type** — классификация типа объекта
7. **Map Services** — сопоставление SMM-услуг
8. **Normalize** — приведение к каноническому виду
9. **Output** — структурированный JSON

---

## 2. Правила парсинга URL

### 2.1 Базовый парсинг

```javascript
function parseUrl(url) {
  // Добавить схему если отсутствует
  if (!url.match(/^https?:\/\//i) && !url.match(/^[a-z]+:\/\//i)) {
    url = 'https://' + url;
  }
  
  const parsed = new URL(url);
  
  return {
    scheme: parsed.protocol.replace(':', ''),
    host: parsed.hostname.toLowerCase(),
    port: parsed.port || null,
    path: parsed.pathname,
    query: Object.fromEntries(parsed.searchParams),
    hash: parsed.hash.replace('#', '') || null,
    original: url
  };
}
```

### 2.2 Нормализация хоста

```javascript
function normalizeHost(host) {
  // Удалить www.
  host = host.replace(/^www\./i, '');
  
  // Удалить m. для мобильных версий
  host = host.replace(/^m\./i, '');
  
  // Привести к нижнему регистру
  host = host.toLowerCase();
  
  return host;
}
```

### 2.3 Нормализация пути

```javascript
function normalizePath(path) {
  // Удалить trailing slash
  path = path.replace(/\/+$/, '');
  
  // Удалить множественные слеши
  path = path.replace(/\/+/g, '/');
  
  return path;
}
```

---

## 3. Определение платформы

### 3.1 Таблица доменов

| Платформа | Основной домен | Дополнительные домены |
|-----------|----------------|----------------------|
| VK | vk.com | m.vk.com, vk.me, vk.cc, live.vkvideo.ru |
| YouTube | youtube.com | youtu.be, m.youtube.com, youtube-nocookie.com |
| Instagram | instagram.com | instagr.am, ig.me |
| TikTok | tiktok.com | vm.tiktok.com |
| Facebook | facebook.com | fb.com, fb.me, fb.watch, m.facebook.com |
| X (Twitter) | x.com | twitter.com, t.co |
| Telegram | t.me | telegram.me |
| WhatsApp | wa.me | chat.whatsapp.com, api.whatsapp.com |
| Discord | discord.com | discord.gg, discordapp.com |
| LinkedIn | linkedin.com | linkedin.cn |
| Pinterest | pinterest.com | pin.it, in.pinterest.com, ru.pinterest.com |
| Reddit | reddit.com | redd.it, old.reddit.com |
| Snapchat | snapchat.com | snap.com |
| Twitch | twitch.tv | clips.twitch.tv |
| Spotify | open.spotify.com | spotify.com, spoti.fi |
| Threads | threads.net | |
| OK.ru | ok.ru | m.ok.ru |
| Rutube | rutube.ru | rutube.video |
| Dzen | dzen.ru | zen.yandex.ru |
| MAX | max.ru | web.max.ru |
| Likee | likee.com | likee.video |
| Viber | viber.com | vb.me |
| Line | line.me | |

### 3.2 Алгоритм определения

```javascript
function detectPlatform(host) {
  const normalizedHost = normalizeHost(host);
  
  // Прямое совпадение
  const platformMap = {
    'vk.com': 'vk',
    'youtube.com': 'youtube',
    'youtu.be': 'youtube',
    'instagram.com': 'instagram',
    'tiktok.com': 'tiktok',
    'vm.tiktok.com': 'tiktok',
    'facebook.com': 'facebook',
    'fb.com': 'facebook',
    'fb.watch': 'facebook',
    'x.com': 'twitter',
    'twitter.com': 'twitter',
    't.co': 'twitter',
    't.me': 'telegram',
    'telegram.me': 'telegram',
    'wa.me': 'whatsapp',
    'chat.whatsapp.com': 'whatsapp',
    'discord.com': 'discord',
    'discord.gg': 'discord',
    'linkedin.com': 'linkedin',
    'pinterest.com': 'pinterest',
    'pin.it': 'pinterest',
    'reddit.com': 'reddit',
    'redd.it': 'reddit',
    'snapchat.com': 'snapchat',
    'twitch.tv': 'twitch',
    'open.spotify.com': 'spotify',
    'threads.net': 'threads',
    'ok.ru': 'ok',
    'rutube.ru': 'rutube',
    'dzen.ru': 'dzen',
    'zen.yandex.ru': 'dzen',
    'max.ru': 'max',
    'likee.com': 'likee',
    'viber.com': 'viber',
    'vb.me': 'viber',
    'line.me': 'line'
  };
  
  // Проверка точного совпадения
  if (platformMap[normalizedHost]) {
    return platformMap[normalizedHost];
  }
  
  // Проверка по суффиксу для региональных доменов
  if (normalizedHost.endsWith('.pinterest.com')) {
    return 'pinterest';
  }
  
  return null;
}
```

---

## 4. Извлечение идентификаторов

### 4.1 Структура регулярных выражений

Каждое регулярное выражение должно:
1. Начинаться с `^` для привязки к началу
2. Заканчиваться на `$` или быть готовым к частичному совпадению
3. Использовать именованные группы для удобства

### 4.2 Примеры regex для VK

```javascript
const VK_PATTERNS = {
  // Профиль по ID: vk.com/id123456
  profileId: {
    regex: /^https?:\/\/(?:m\.)?vk\.com\/id(\d+)$/,
    groups: ['user_id'],
    type: 'profile'
  },
  
  // Профиль по screen_name: vk.com/durov
  profileName: {
    regex: /^https?:\/\/(?:m\.)?vk\.com\/([a-zA-Z][a-zA-Z0-9_.]{1,31})$/,
    groups: ['screen_name'],
    type: 'profile',
    validate: (match) => {
      // Исключить зарезервированные слова
      const reserved = ['wall', 'photo', 'video', 'clip', 'audio', 'album', 
                        'market', 'board', 'topic', 'event', 'club', 'public'];
      return !reserved.includes(match[1].toLowerCase());
    }
  },
  
  // Группа: vk.com/club123456
  group: {
    regex: /^https?:\/\/(?:m\.)?vk\.com\/(?:club|public|event)(\d+)$/,
    groups: ['group_id'],
    type: 'group'
  },
  
  // Пост: vk.com/wall-123_456
  wallPost: {
    regex: /^https?:\/\/(?:m\.)?vk\.com\/wall(-?\d+)_(\d+)$/,
    groups: ['owner_id', 'post_id'],
    type: 'post',
    transform: (match) => ({
      owner_id: parseInt(match[1]),
      post_id: parseInt(match[2]),
      is_community: match[1].startsWith('-')
    })
  },
  
  // Комментарий: vk.com/wall-123_456?reply=789
  comment: {
    regex: /^https?:\/\/(?:m\.)?vk\.com\/wall(-?\d+)_(\d+)\?reply=(\d+)/,
    groups: ['owner_id', 'post_id', 'comment_id'],
    type: 'comment'
  },
  
  // Фото: vk.com/photo-123_456
  photo: {
    regex: /^https?:\/\/(?:m\.)?vk\.com\/photo(-?\d+)_(\d+)$/,
    groups: ['owner_id', 'photo_id'],
    type: 'photo'
  },
  
  // Видео: vk.com/video-123_456
  video: {
    regex: /^https?:\/\/(?:m\.)?vk\.com\/video(-?\d+)_(\d+)$/,
    groups: ['owner_id', 'video_id'],
    type: 'video'
  },
  
  // Клип: vk.com/clip-123_456
  clip: {
    regex: /^https?:\/\/(?:m\.)?vk\.com\/clip(-?\d+)_(\d+)$/,
    groups: ['owner_id', 'clip_id'],
    type: 'clip'
  }
};
```

### 4.3 Универсальная функция извлечения

```javascript
function extractIds(url, patterns) {
  const parsed = parseUrl(url);
  const fullUrl = `${parsed.scheme}://${parsed.host}${parsed.path}${buildQueryString(parsed.query)}`;
  
  for (const [name, pattern] of Object.entries(patterns)) {
    const match = fullUrl.match(pattern.regex);
    
    if (match) {
      // Проверка дополнительной валидации
      if (pattern.validate && !pattern.validate(match)) {
        continue;
      }
      
      // Извлечение групп
      const ids = {};
      pattern.groups.forEach((group, index) => {
        ids[group] = match[index + 1];
      });
      
      // Трансформация значений
      let result = { ids, type: pattern.type };
      if (pattern.transform) {
        result = { ...result, ...pattern.transform(match) };
      }
      
      return result;
    }
  }
  
  return null;
}
```

---

## 5. Классификация типа объекта

### 5.1 Иерархия типов

```
OBJECT
├── PROFILE (профиль/канал)
│   ├── user (пользователь)
│   ├── channel (канал)
│   ├── page (страница)
│   └── group (группа/сообщество)
│
├── CONTENT (контент)
│   ├── post (пост/запись)
│   ├── photo (фото)
│   ├── video (видео)
│   ├── audio (аудио)
│   ├── clip (короткое видео)
│   ├── story (сторис)
│   ├── reel (рилс)
│   ├── short (шортс)
│   ├── article (статья)
│   └── comment (комментарий)
│
├── COLLECTION (коллекция)
│   ├── playlist (плейлист)
│   ├── album (альбом)
│   ├── board (доска)
│   └── topic (тема/обсуждение)
│
├── INTERACTION (взаимодействие)
│   ├── chat (чат)
│   ├── invite (приглашение)
│   └── event (событие)
│
└── COMMERCE (коммерция)
    ├── product (товар)
    ├── shop (магазин)
    └── marketplace (маркетплейс)
```

### 5.2 Мэппинг типов по платформам

```javascript
const TYPE_MAPPING = {
  vk: {
    profile: ['user', 'profile'],
    group: ['group', 'public', 'event'],
    post: ['wall', 'post'],
    photo: ['photo'],
    video: ['video'],
    clip: ['clip'],
    comment: ['comment'],
    album: ['album'],
    product: ['product'],
    topic: ['topic'],
    article: ['article']
  },
  
  youtube: {
    profile: ['channel'],
    video: ['video'],
    short: ['shorts'],
    live: ['live'],
    playlist: ['playlist'],
    clip: ['clip'],
    community: ['post']
  },
  
  instagram: {
    profile: ['user', 'profile'],
    post: ['post'],
    reel: ['reel'],
    igtv: ['igtv'],
    story: ['story'],
    highlight: ['highlight'],
    hashtag: ['hashtag']
  },
  
  tiktok: {
    profile: ['user'],
    video: ['video'],
    live: ['live'],
    hashtag: ['hashtag'],
    music: ['music']
  }
};
```

---

## 6. Нормализация ссылок

### 6.1 Правила нормализации

1. **Схема** — всегда `https://`
2. **Хост** — без `www.` и `m.`
3. **Путь** — без trailing slash
4. **Query** — удалить UTM и служебные параметры
5. **Канонический домен** — использовать основной домен платформы

### 6.2 Функция нормализации

```javascript
const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 
                    'utm_term', 'utm_content', 'fbclid', 'gclid',
                    'igshid', 'ref', 'src'];

function normalizeUrl(url, platform) {
  const parsed = parseUrl(url);
  
  // Удалить служебные query-параметры
  const cleanQuery = {};
  for (const [key, value] of Object.entries(parsed.query)) {
    if (!UTM_PARAMS.includes(key.toLowerCase())) {
      cleanQuery[key] = value;
    }
  }
  
  // Определить канонический домен
  const canonicalDomains = {
    vk: 'vk.com',
    youtube: 'youtube.com',
    instagram: 'instagram.com',
    tiktok: 'tiktok.com',
    facebook: 'facebook.com',
    twitter: 'x.com',
    telegram: 't.me',
    whatsapp: 'wa.me',
    discord: 'discord.com',
    linkedin: 'linkedin.com',
    pinterest: 'pinterest.com',
    reddit: 'reddit.com',
    snapchat: 'snapchat.com',
    twitch: 'twitch.tv',
    spotify: 'open.spotify.com',
    threads: 'threads.net',
    ok: 'ok.ru',
    rutube: 'rutube.ru',
    dzen: 'dzen.ru',
    max: 'max.ru',
    likee: 'likee.com',
    viber: 'viber.com',
    line: 'line.me'
  };
  
  const canonicalHost = canonicalDomains[platform] || parsed.host;
  const normalizedPath = normalizePath(parsed.path);
  
  // Собрать нормализованный URL
  let normalizedUrl = `https://${canonicalHost}${normalizedPath}`;
  
  // Добавить необходимые query-параметры
  const queryString = Object.entries(cleanQuery)
    .filter(([key]) => !UTM_PARAMS.includes(key.toLowerCase()))
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
    
  if (queryString) {
    normalizedUrl += `?${queryString}`;
  }
  
  return normalizedUrl;
}
```

### 6.3 Примеры нормализации

| Исходная ссылка | Нормализованная |
|-----------------|-----------------|
| `m.vk.com/wall-123_456` | `https://vk.com/wall-123_456` |
| `www.instagram.com/p/abc/?igshid=xyz` | `https://instagram.com/p/abc` |
| `youtube.com/watch?v=ID&t=123` | `https://youtube.com/watch?v=ID` |
| `twitter.com/user/status/123` | `https://x.com/user/status/123` |
| `fb.com/username` | `https://facebook.com/username` |

---

## 7. Валидация

### 7.1 Уровни валидации

1. **Syntax** — корректность URL синтаксиса
2. **Domain** — принадлежность домена к платформе
3. **Format** — соответствие ожидаемому паттерну
4. **Semantic** — логическая корректность (например, ID > 0)

### 7.2 Функция валидации

```javascript
function validateUrl(url, platform, patterns) {
  const errors = [];
  const warnings = [];
  
  // 1. Проверка синтаксиса
  try {
    const parsed = new URL(url.startsWith('http') ? url : 'https://' + url);
  } catch (e) {
    errors.push({
      code: 'INVALID_SYNTAX',
      message: 'Некорректный синтаксис URL',
      level: 'error'
    });
    return { valid: false, errors, warnings };
  }
  
  // 2. Проверка домена
  if (!platform) {
    errors.push({
      code: 'UNKNOWN_PLATFORM',
      message: 'Неподдерживаемая платформа',
      level: 'error'
    });
    return { valid: false, errors, warnings };
  }
  
  // 3. Проверка формата
  const extraction = extractIds(url, patterns);
  if (!extraction) {
    errors.push({
      code: 'INVALID_FORMAT',
      message: `Ссылка не соответствует ни одному из форматов ${platform}`,
      level: 'error'
    });
    return { valid: false, errors, warnings };
  }
  
  // 4. Семантическая проверка
  // VK: owner_id != 0
  if (platform === 'vk' && extraction.ids.owner_id === 0) {
    errors.push({
      code: 'INVALID_OWNER_ID',
      message: 'Owner ID не может быть равен 0',
      level: 'error'
    });
  }
  
  // YouTube: video_id должен быть 11 символов
  if (platform === 'youtube' && extraction.ids.video_id) {
    if (extraction.ids.video_id.length !== 11) {
      warnings.push({
        code: 'SUSPICIOUS_VIDEO_ID',
        message: 'Video ID имеет необычную длину',
        level: 'warning'
      });
    }
  }
  
  // TikTok: video_id должен быть ~19 цифр
  if (platform === 'tiktok' && extraction.ids.video_id) {
    if (!/^\d{18,20}$/.test(extraction.ids.video_id)) {
      warnings.push({
        code: 'SUSPICIOUS_VIDEO_ID',
        message: 'TikTok Video ID имеет необычный формат',
        level: 'warning'
      });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    extraction
  };
}
```

---

## 8. Обработка edge cases

### 8.1 Сокращённые ссылки

```javascript
const SHORT_LINK_DOMAINS = {
  'vm.tiktok.com': { platform: 'tiktok', requires_resolution: true },
  't.co': { platform: 'twitter', requires_resolution: true },
  'fb.me': { platform: 'facebook', requires_resolution: true },
  'pin.it': { platform: 'pinterest', requires_resolution: true },
  'vk.cc': { platform: 'vk', requires_resolution: true },
  'spoti.fi': { platform: 'spotify', requires_resolution: true },
  'redd.it': { platform: 'reddit', requires_resolution: true }
};

function handleShortLink(url) {
  const parsed = parseUrl(url);
  const shortInfo = SHORT_LINK_DOMAINS[parsed.host];
  
  if (shortInfo?.requires_resolution) {
    return {
      needsResolution: true,
      platform: shortInfo.platform,
      message: 'Сокращённая ссылка требует раскрытия для получения ID'
    };
  }
  
  return { needsResolution: false };
}
```

### 8.2 Deep Links

```javascript
const DEEP_LINK_SCHEMES = {
  'tg://': 'telegram',
  'viber://': 'viber',
  'whatsapp://': 'whatsapp',
  'instagram://': 'instagram',
  'tiktok://': 'tiktok',
  'snapchat://': 'snapchat',
  'spotify:': 'spotify',
  'line://': 'line'
};

function handleDeepLink(url) {
  for (const [scheme, platform] of Object.entries(DEEP_LINK_SCHEMES)) {
    if (url.startsWith(scheme)) {
      return {
        isDeepLink: true,
        platform,
        message: 'Deep link обнаружен. Рекомендуется преобразовать в веб-формат для SMM'
      };
    }
  }
  
  return { isDeepLink: false };
}

// Конвертация deep links в веб-формат
function convertDeepLinkToWeb(url) {
  const conversions = {
    // Telegram
    /^tg:\/\/resolve\?domain=([a-zA-Z0-9_]+)/: (m) => `https://t.me/${m[1]}`,
    
    // WhatsApp
    /^whatsapp:\/\/send\?phone=(\d+)/: (m) => `https://wa.me/${m[1]}`,
    
    // Viber
    /^viber:\/\/chat\?number=(\d+)/: (m) => `https://wa.me/${m[1]}`,
    /^viber:\/\/pa\?chatURI=([a-zA-Z0-9_]+)/: (m) => `https://vb.me/${m[1]}`,
    
    // Spotify URI
    /^spotify:(track|album|playlist|artist):([a-zA-Z0-9]{22})/: 
      (m) => `https://open.spotify.com/${m[1]}/${m[2]}`,
    
    // Line
    /^line:\/\/msg\/text\/(.+)/: (m) => decodeURIComponent(m[1])
  };
  
  for (const [pattern, converter] of Object.entries(conversions)) {
    const match = url.match(pattern);
    if (match) {
      return converter(match);
    }
  }
  
  return null;
}
```

### 8.3 Региональные домены

```javascript
const REGIONAL_DOMAINS = {
  pinterest: [
    'in.pinterest.com', 'ru.pinterest.com', 'de.pinterest.com',
    'fr.pinterest.com', 'es.pinterest.com', 'jp.pinterest.com',
    'br.pinterest.com', 'ca.pinterest.com', 'au.pinterest.com'
  ],
  youtube: [
    'm.youtube.com', 'music.youtube.com', 'gaming.youtube.com'
  ],
  facebook: [
    'm.facebook.com', 'mbasic.facebook.com'
  ]
};

function normalizeRegionalDomain(host, platform) {
  const regional = REGIONAL_DOMAINS[platform] || [];
  
  // Проверить, является ли домен региональным вариантом
  for (const regionalHost of regional) {
    if (host === regionalHost) {
      // Вернуть канонический домен
      const canonicalMap = {
        pinterest: 'pinterest.com',
        youtube: 'youtube.com',
        facebook: 'facebook.com'
      };
      return canonicalMap[platform];
    }
  }
  
  return host;
}
```

---

## 9. Обработка ошибок

### 9.1 Коды ошибок

| Код | Описание | Уровень |
|-----|----------|---------|
| `INVALID_SYNTAX` | Некорректный синтаксис URL | error |
| `UNKNOWN_PLATFORM` | Неподдерживаемая платформа | error |
| `INVALID_FORMAT` | Не соответствует формату платформы | error |
| `EMPTY_ID` | Пустой или отсутствующий ID | error |
| `INVALID_ID` | Некорректный формат ID | error |
| `DELETED_CONTENT` | Контент удалён | error |
| `PRIVATE_CONTENT` | Контент приватный | warning |
| `SHORT_LINK` | Сокращённая ссылка требует раскрытия | info |
| `DEEP_LINK` | Deep link требует конвертации | info |

### 9.2 Структура ответа об ошибке

```json
{
  "success": false,
  "error": {
    "code": "INVALID_FORMAT",
    "message": "Ссылка не соответствует формату VK",
    "level": "error",
    "details": {
      "platform": "vk",
      "expected_patterns": ["wall{owner_id}_{post_id}", "photo{owner_id}_{photo_id}"],
      "provided_url": "https://vk.com/invalid"
    }
  }
}
```

---

## 10. Выходной формат

### 10.1 Успешный анализ

```json
{
  "success": true,
  "data": {
    "platform": {
      "id": "vk",
      "name": "ВКонтакте",
      "category": "social_network"
    },
    "url": {
      "original": "https://m.vk.com/wall-22884714_12345?reply=67890",
      "normalized": "https://vk.com/wall-22884714_12345?reply=67890",
      "canonical": "https://vk.com/wall-22884714_12345?reply=67890"
    },
    "type": {
      "id": "comment",
      "name": "Комментарий",
      "category": "content"
    },
    "ids": {
      "owner_id": -22884714,
      "post_id": 12345,
      "comment_id": 67890
    },
    "metadata": {
      "is_community": true,
      "community_id": 22884714
    },
    "smm": {
      "available_services": ["comment_likes"],
      "recommended_service": "comment_likes"
    },
    "validation": {
      "valid": true,
      "warnings": []
    }
  }
}
```

### 10.2 Минимальный формат

```json
{
  "platform": "vk",
  "type": "comment",
  "ids": {
    "owner_id": -22884714,
    "post_id": 12345,
    "comment_id": 67890
  },
  "normalized_url": "https://vk.com/wall-22884714_12345?reply=67890"
}
```

---

## 11. Оптимизация производительности

### 11.1 Кэширование regex

```javascript
const regexCache = new Map();

function getCompiledRegex(pattern) {
  if (!regexCache.has(pattern)) {
    regexCache.set(pattern, new RegExp(pattern, 'i'));
  }
  return regexCache.get(pattern);
}
```

### 11.2 Ранний выход

```javascript
function analyzeUrl(url) {
  // Быстрое определение платформы по домену
  const platform = detectPlatform(url);
  if (!platform) {
    return { error: 'UNKNOWN_PLATFORM' };
  }
  
  // Использовать только паттерны для конкретной платформы
  const patterns = PLATFORM_PATTERNS[platform];
  if (!patterns) {
    return { error: 'UNSUPPORTED_PLATFORM' };
  }
  
  // Дальнейший анализ...
}
```

### 11.3 Ленивая загрузка паттернов

```javascript
const patternsCache = {};

async function getPatterns(platform) {
  if (!patternsCache[platform]) {
    // Динамическая загрузка паттернов для платформы
    patternsCache[platform] = await import(`./patterns/${platform}.js`);
  }
  return patternsCache[platform];
}
```

---

*Документ версии 3.0 от 2026-03-27*
