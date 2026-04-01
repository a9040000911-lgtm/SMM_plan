# Тестовые случаи для анализатора ссылок

Этот файл содержит тестовые случаи для проверки корректности работы анализатора.

---

## 1. VK (ВКонтакте)

### 1.1 Однозначные форматы

| URL | Ожидаемый тип | IDs | Статус |
|-----|---------------|-----|--------|
| `https://vk.com/id1` | profile_id | `user_id: "1"` | ✅ |
| `https://vk.com/club22884714` | group_id | `type: "club", group_id: "22884714"` | ✅ |
| `https://vk.com/public123456` | group_id | `type: "public", group_id: "123456"` | ✅ |
| `https://vk.com/event123456` | group_id | `type: "event", group_id: "123456"` | ✅ |
| `https://vk.com/wall-22884714_12345` | wall_post | `owner_id: "-22884714", post_id: "12345"` | ✅ |
| `https://vk.com/wall123_456` | wall_post | `owner_id: "123", post_id: "456"` | ✅ |
| `https://vk.com/photo-123_456` | photo | `owner_id: "-123", photo_id: "456"` | ✅ |
| `https://vk.com/video-123_456` | video | `owner_id: "-123", video_id: "456"` | ✅ |
| `https://vk.com/clip-123_456` | clip | `owner_id: "-123", clip_id: "456"` | ✅ |
| `https://m.vk.com/wall-123_456` | wall_post | `owner_id: "-123", post_id: "456"` | ✅ (нормализация) |

### 1.2 Неоднозначные форматы (должны вернуть ambiguity)

| URL | Статус | ambiguity_type |
|-----|--------|----------------|
| `https://vk.com/durov` | ⚠️ ambiguity | vk_screen_name |
| `https://vk.com/aprilclub` | ⚠️ ambiguity | vk_screen_name |
| `https://vk.com/telegram` | ⚠️ ambiguity | vk_screen_name |

### 1.3 Некорректные форматы

| URL | Ожидаемая ошибка |
|-----|------------------|
| `https://vk.com/wall` | INVALID_FORMAT |
| `https://vk.com/photo` | INVALID_FORMAT |
| `https://vk.com/video` | INVALID_FORMAT |
| `https://vk.com/clip` | INVALID_FORMAT |
| `https://vk.com/wall-123` | INVALID_FORMAT |
| `https://vk.com/wall123_` | INVALID_FORMAT |

---

## 2. YouTube

### 2.1 Корректные форматы

| URL | Ожидаемый тип | IDs | Статус |
|-----|---------------|-----|--------|
| `https://youtube.com/watch?v=dQw4w9WgXcQ` | video | `video_id: "dQw4w9WgXcQ"` | ✅ |
| `https://youtu.be/dQw4w9WgXcQ` | video_short | `video_id: "dQw4w9WgXcQ"` | ✅ |
| `https://youtube.com/shorts/dQw4w9WgXcQ` | shorts | `video_id: "dQw4w9WgXcQ"` | ✅ |
| `https://youtube.com/live/dQw4w9WgXcQ` | live | `video_id: "dQw4w9WgXcQ"` | ✅ |
| `https://youtube.com/@MrBeast` | channel_handle | `handle: "MrBeast"` | ✅ |
| `https://youtube.com/channel/UCX6OQ3DkA2zQ5j3z5xZ5c6A` | channel_id | `channel_id: "UCX6OQ3DkA2zQ5j3z5xZ5c6A"` | ✅ |
| `https://youtube.com/playlist?list=PLrAXtmRdnEQy4Q` | playlist | `playlist_id: "PLrAXtmRdnEQy4Q"` | ✅ |

### 2.2 Некорректные форматы

| URL | Ожидаемая ошибка |
|-----|------------------|
| `https://youtube.com/watch?v=` | INVALID_FORMAT |
| `https://youtube.com/watch?v=abc` | INVALID_FORMAT (11 chars required) |
| `https://youtube.com/watch?v=abcdefghijklmnopqrstuv` | INVALID_FORMAT (too long) |

---

## 3. Instagram

### 3.1 Корректные форматы

| URL | Ожидаемый тип | IDs | Статус |
|-----|---------------|-----|--------|
| `https://instagram.com/instagram` | profile | `username: "instagram"` | ✅ |
| `https://instagram.com/p/CgBxesYIjZ/` | post | `shortcode: "CgBxesYIjZ"` | ✅ |
| `https://instagram.com/reel/CgBxesYIjZ/` | reel | `shortcode: "CgBxesYIjZ"` | ✅ |
| `https://instagram.com/stories/instagram/123456789/` | story | `username: "instagram", story_id: "123456789"` | ✅ |
| `https://instagram.com/stories/highlights/1234567890123456789/` | highlight | `highlight_id: "1234567890123456789"` | ✅ |
| `https://instagram.com/explore/tags/fashion/` | hashtag | `tag: "fashion"` | ✅ |

### 3.2 Нормализация

| Исходный URL | Нормализованный |
|--------------|-----------------|
| `https://www.instagram.com/p/abc/?igshid=xyz` | `https://instagram.com/p/abc` |
| `https://instagram.com/p/abc/?utm_source=share` | `https://instagram.com/p/abc` |

---

## 4. TikTok

### 4.1 Корректные форматы

| URL | Ожидаемый тип | IDs | Статус |
|-----|---------------|-----|--------|
| `https://tiktok.com/@tiktok` | profile | `username: "tiktok"` | ✅ |
| `https://tiktok.com/@tiktok/video/1234567890123456789` | video | `username: "tiktok", video_id: "1234567890123456789"` | ✅ |
| `https://vm.tiktok.com/ZM6abc123/` | video_vm | `code: "ZM6abc123"` | ✅ (requires_resolution) |
| `https://tiktok.com/tag/fyp` | hashtag | `tag: "fyp"` | ✅ |
| `https://tiktok.com/@tiktok/live` | live | `username: "tiktok"` | ✅ |

---

## 5. Facebook

### 5.1 Однозначные форматы

| URL | Ожидаемый тип | IDs | Статус |
|-----|---------------|-----|--------|
| `https://facebook.com/profile.php?id=123456789` | profile_id | `user_id: "123456789"` | ✅ |
| `https://facebook.com/pages/FacebookApp/123456789` | page_id | `page_id: "123456789"` | ✅ |
| `https://facebook.com/groups/123456789` | group | `group_id: "123456789"` | ✅ |
| `https://facebook.com/zuck/posts/10112345678901234` | post | `username: "zuck", post_id: "10112345678901234"` | ✅ |
| `https://facebook.com/reel/1234567890123456` | reel | `reel_id: "1234567890123456"` | ✅ |

### 5.2 Неоднозначные форматы

| URL | Статус | ambiguity_type |
|-----|--------|----------------|
| `https://facebook.com/zuck` | ⚠️ ambiguity | fb_profile_page |
| `https://facebook.com/FacebookApp` | ⚠️ ambiguity | fb_profile_page |

---

## 6. Telegram

### 6.1 Однозначные форматы

| URL | Ожидаемый тип | IDs | Статус |
|-----|---------------|-----|--------|
| `https://t.me/telegram/123` | channel_post | `channel: "telegram", post_id: "123"` | ✅ |
| `https://t.me/telegram/123?comment=456` | comment | `channel: "telegram", post_id: "123", comment_id: "456"` | ✅ |
| `https://t.me/c/1234567890/123` | private_post | `channel_id: "1234567890", post_id: "123"` | ✅ |
| `https://t.me/+abc123DEF` | join | `invite_code: "abc123DEF"` | ✅ |
| `https://t.me/joinchat/UVW1l84hDzM5M2Iy` | joinchat | `invite_code: "UVW1l84hDzM5M2Iy"` | ✅ |

### 6.2 Неоднозначные форматы

| URL | Статус | ambiguity_type |
|-----|--------|----------------|
| `https://t.me/telegram` | ⚠️ ambiguity | tg_entity_type |
| `https://t.me/durov` | ⚠️ ambiguity | tg_entity_type |
| `https://t.me/BotFather` | ⚠️ ambiguity | tg_entity_type (но похоже на бот) |

---

## 7. Douyin

### 7.1 Корректные форматы

| URL | Ожидаемый тип | IDs | Статус |
|-----|---------------|-----|--------|
| `https://douyin.com/user/MS4wLjABAAAA` | profile_id | `user_id: "MS4wLjABAAAA"` | ✅ |
| `https://douyin.com/@username` | profile_name | `username: "username"` | ✅ |
| `https://douyin.com/video/1234567890123456` | video | `video_id: "1234567890123456"` | ✅ |
| `https://v.douyin.com/iRNBhHU/` | short_link | `code: "iRNBhHU"` | ✅ (requires_resolution) |

---

## 8. Weibo

### 8.1 Корректные форматы

| URL | Ожидаемый тип | IDs | Статус |
|-----|---------------|-----|--------|
| `https://weibo.com/u/1234567890` | profile_uid | `uid: "1234567890"` | ✅ |
| `https://weibo.com/username` | profile_name | `username: "username"` | ✅ |
| `https://weibo.com/1234567890/Oabcdefg` | post | `uid: "1234567890", post_id: "Oabcdefg"` | ✅ |

---

## 9. Bilibili

### 9.1 Корректные форматы

| URL | Ожидаемый тип | IDs | Статус |
|-----|---------------|-----|--------|
| `https://space.bilibili.com/12345678` | profile | `uid: "12345678"` | ✅ |
| `https://bilibili.com/video/BV1xx411c7mD` | video_bv | `bv_id: "BV1xx411c7mD"` | ✅ |
| `https://bilibili.com/video/av12345678` | video_av | `av_id: "12345678"` | ✅ |
| `https://b23.tv/BV1xx411c7mD` | short_link | `bv_id: "BV1xx411c7mD"` | ✅ |

---

## 10. WhatsApp

### 10.1 Корректные форматы

| URL | Ожидаемый тип | IDs | Статус |
|-----|---------------|-----|--------|
| `https://wa.me/71234567890` | click_to_chat | `phone: "71234567890"` | ✅ |
| `https://wa.me/71234567890?text=Hello` | click_to_chat_text | `phone: "71234567890", text: "Hello"` | ✅ |
| `https://chat.whatsapp.com/XXXXXXXXXXXXXXXXXXXXXX` | group | `invite_code: "XXXXXXXXXXXXXXXXXXXXXX"` | ✅ |

### 10.2 Нормализация телефонов

| Исходный | Нормализованный |
|----------|-----------------|
| `+7 (999) 123-45-67` | `79991234567` |
| `7-999-123-45-67` | `79991234567` |

---

## 11. Spotify

### 11.1 Корректные форматы

| URL | Ожидаемый тип | IDs | Статус |
|-----|---------------|-----|--------|
| `https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh` | track | `track_id: "4iV5W9uYEdYUVa79Axb7Rh"` | ✅ |
| `https://open.spotify.com/album/1A2GTWGtrFRACTpXLGQhYa` | album | `album_id: "1A2GTWGtrFRACTpXLGQhYa"` | ✅ |
| `https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M` | playlist | `playlist_id: "37i9dQZF1DXcBWIGoYBM5M"` | ✅ |
| `spotify:track:4iV5W9uYEdYUVa79Axb7Rh` | uri | `type: "track", id: "4iV5W9uYEdYUVa79Axb7Rh"` | ✅ |

### 11.2 Некорректные форматы

| URL | Ожидаемая ошибка |
|-----|------------------|
| `spotify:track:abc` | INVALID_FORMAT (22 chars required) |
| `spotify:track:4iV5W9uYEdYUVa79Axb7Rh:extra` | INVALID_FORMAT (extra chars after ID) |

---

## 12. Неизвестные платформы

| URL | Ожидаемая ошибка |
|-----|------------------|
| `https://unknown-site.com/page` | UNKNOWN_PLATFORM |
| `https://example.com/user/123` | UNKNOWN_PLATFORM |
| `random-text` | INVALID_SYNTAX |

---

## 13. Deep Links

### 13.1 Telegram

| Deep Link | Веб-эквивалент |
|-----------|----------------|
| `tg://resolve?domain=telegram` | `https://t.me/telegram` |
| `tg://resolve?phone=71234567890` | — (по номеру телефона) |

### 13.2 WhatsApp

| Deep Link | Веб-эквивалент |
|-----------|----------------|
| `whatsapp://send?phone=71234567890` | `https://wa.me/71234567890` |

### 13.3 Viber

| Deep Link | Веб-эквивалент |
|-----------|----------------|
| `viber://chat?number=71234567890` | — |
| `viber://pa?chatURI=BotName` | `https://vb.me/BotName` |

---

## Скрипт для автоматического тестирования

```javascript
// test-analyzer.js

const TEST_CASES = {
  vk: {
    valid: [
      { url: 'https://vk.com/id1', expected: { type: 'profile_id', ids: { user_id: '1' } } },
      { url: 'https://vk.com/club22884714', expected: { type: 'group_id', ids: { type: 'club', group_id: '22884714' } } },
      { url: 'https://vk.com/wall-22884714_12345', expected: { type: 'wall_post', ids: { owner_id: '-22884714', post_id: '12345' } } }
    ],
    ambiguous: [
      { url: 'https://vk.com/durov', expected: { ambiguity_type: 'vk_screen_name' } }
    ],
    invalid: [
      { url: 'https://vk.com/wall', expected: { error: 'INVALID_FORMAT' } }
    ]
  },
  youtube: {
    valid: [
      { url: 'https://youtube.com/watch?v=dQw4w9WgXcQ', expected: { type: 'video', ids: { video_id: 'dQw4w9WgXcQ' } } },
      { url: 'https://youtu.be/dQw4w9WgXcQ', expected: { type: 'video_short', ids: { video_id: 'dQw4w9WgXcQ' } } },
      { url: 'https://youtube.com/@MrBeast', expected: { type: 'channel_handle', ids: { handle: 'MrBeast' } } }
    ]
  }
};

function runTests() {
  console.log('🧪 Running analyzer tests...\n');
  
  let passed = 0, failed = 0;
  
  for (const [platform, categories] of Object.entries(TEST_CASES)) {
    console.log(`\n📱 ${platform.toUpperCase()}`);
    
    // Valid tests
    for (const test of categories.valid || []) {
      const result = analyzeUrl(test.url);
      const match = result.type === test.expected.type && 
                    JSON.stringify(result.ids) === JSON.stringify(test.expected.ids);
      
      if (match) {
        console.log(`  ✅ ${test.url}`);
        passed++;
      } else {
        console.log(`  ❌ ${test.url}`);
        console.log(`     Expected: ${JSON.stringify(test.expected)}`);
        console.log(`     Got: ${JSON.stringify(result)}`);
        failed++;
      }
    }
    
    // Ambiguous tests
    for (const test of categories.ambiguous || []) {
      const result = analyzeUrl(test.url);
      const match = result.status === 'ambiguity' && 
                    result.ambiguity.type === test.expected.ambiguity_type;
      
      if (match) {
        console.log(`  ⚠️  ${test.url} (ambiguity detected)`);
        passed++;
      } else {
        console.log(`  ❌ ${test.url} (should be ambiguous)`);
        failed++;
      }
    }
    
    // Invalid tests
    for (const test of categories.invalid || []) {
      const result = analyzeUrl(test.url);
      const match = result.status === 'error' && 
                    result.error.code === test.expected.error;
      
      if (match) {
        console.log(`  ✅ ${test.url} (correctly rejected)`);
        passed++;
      } else {
        console.log(`  ❌ ${test.url} (should fail)`);
        failed++;
      }
    }
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`Success rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  return { passed, failed };
}

// Run tests
runTests();
```

---

*Тестовые случаи версии 4.0.0 от 2026-03-27*
