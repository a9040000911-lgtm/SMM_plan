# Module: Link Service

## 📍 Назначение
Единый аналитический центр для обработки, нормализации и валидации входящих ссылок из всех поддерживаемых социальных сетей.

## 🛠 Технический стек
- **Файл**: `src/services/link.service.ts`
- **Зависимости**: Prisma (Platform, Category Enums)

## 📋 Функционал
- **`analyze(link: string)`**: 
  - Определяет `Platform` (TG, IG, VK, YT и т.д.).
  - Определяет `targetType` (POST, CHANNEL, VIDEO, PLAYLIST и т.д.).
  - Выявляет приватность ссылки и наличие альбомов.
- **`validate(link, platform, expectedTarget)`**:
  - Проверяет, соответствует ли ссылка выбранной услуге.
  - Возвращает `isValid` и понятную ошибку на русском языке для пользователя.

## 🔗 Поддерживаемые типы целей (TargetTypes)
- `POST`, `CHANNEL`, `PROFILE`, `VIDEO`, `PHOTO`, `ALBUM`, `PLAYLIST`, `CHANNEL_POSTS`, `STORY`, `POLL`, `MARKET`.

## 🔄 Итерация 27.01.2026
- Добавлена глубокая поддержка VK (плейлисты, товары, фото в альбомах).
- Внедрена логика `CHANNEL_POSTS` для автоматических услуг.
- **Refactoring**: Поле `objectType` переименовано в `targetType` во всех интерфейсах для соответствия Prisma Schema.
- Интеграция с **BroadcastService** для уведомлений об инцидентах.
