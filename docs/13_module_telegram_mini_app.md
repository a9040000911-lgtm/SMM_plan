# Модуль 13: Telegram Mini App (TMA) & API Standard

## 🎯 Цели модуля
Перенос пользовательского интерфейса (выбор услуг, оформление заказа, управление профилем) из текстового интерфейса бота в современное Web-приложение (SPA) внутри Telegram.

## 🏗 Архитектура TMA
Приложение строится по модели **Client-Server**:
- **Frontend**: Next.js App Router, Tailwind CSS, Shadcn/UI (Radix UI).
- **API**: Next.js API Routes (`/api/tma/*`).
- **Auth**: Валидация `window.Telegram.WebApp.initData` на стороне сервера.

## 🔐 Стандарт Безопасности (Auth)
Каждый запрос от TMA к API должен содержать заголовок `Authorization: tma <initData>`.
Сервер **обязан**:
1. Проверить `hash` из `initData` с использованием `BOT_TOKEN`.
2. Извлечь `user.id` и сопоставить его с пользователем в БД.
3. Блокировать запросы с истекшим `auth_date` (> 24 часов).

## 📡 Спецификация API (Endpoints)

### 1. GET `/api/tma/services`
Возвращает дерево категорий и услуг.
**Response:**
```json
{
  "platforms": [
    {
      "id": "TELEGRAM",
      "categories": [
        {
          "id": "SUBSCRIBERS",
          "services": [
            { "id": "TG_SUBS_FAST", "name": "Быстрые подписчики", "price": 100.00, "min": 10, "max": 100000 }
          ]
        }
      ]
    }
  ]
}
```

### 2. POST `/api/tma/orders`
Создание нового заказа.
**Request:**
```json
{ "serviceId": "string", "link": "string", "quantity": number }
```

## 🎨 Дизайн-система
- **Цвета**: Использовать CSS-переменные Telegram (`--tg-theme-bg-color`, `--tg-theme-button-color` и т.д.).
- **Адаптивность**: Mobile-first (ширина строго 100vw).
- **Feedback**: Использование `HapticFeedback` при нажатии кнопок и завершении операций.

## 🛠 Технологический стек
- **React Query**: Обязательно для кеширования списка услуг.
- **Zustand**: Легковесный стейт для корзины/черновика заказа.
- **Zod**: Валидация всех входящих данных в API.
