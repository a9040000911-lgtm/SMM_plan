# 📖 Справочник: Спецификация API (API Specification)

В Smmplan, так как мы используем фреймворк **Next.js 16 (App Router)**, всё API построено на базе `Route Handlers` (`/api/*`) и спецификации `Server Actions`.

Мы используем концепцию Zero-Error Policy и строго валидируем все входные Payload с помощью **Zod**-схем.

## Публичные REST API Маршруты (Public API)

### 1. `POST /api/orders/create`
Создает новый заказ на накрутку (от клиента или Telegram-бота).

**Zod Схема запроса (Request Payload):**
```typescript
{
  serviceId: z.number().int().positive(),
  link: z.string().url("Must be a valid URL"), // Обязательная проверка ссылки
  quantity: z.number().int().min(10).max(1000000), // В зависимости от лимитов услуги
  userId: z.string().uuid().optional(), // Если авторизован
}
```

**Zod Схема ответа (Response Payload):**
```typescript
{
  success: z.boolean(),
  orderId: z.number().optional(),
  message: z.string().optional()
}
```

### 2. `POST /api/payments/webhook`
Анонимный колбек-webhook от платежного провайдера (например, YooKassa).

**Важно:** 
Так как этот эндпоинт открыт для всего интернета, внутри обработчика (`route.ts`) стоит **подпись подлинности IP** самого провайдера (IP Whitelist YooKassa), а также проверка хэша.

## Административные Маршруты (Admin API)

Все маршруты, начинающиеся с `/api/admin/*`, защищены встроенным middleware-фильтром.

### `GET /api/admin/loyalty/stats`
Возвращает финансовую статистику и статистику достижений для конкретного провайдера или проекта. Данные используются для отображения в "Global Treasury Dashboard".

**Параметры:**
- Если передан `projectId`, фильтрует статистику (проверка Multi-Project Architecture).

> [!CAUTION]
> Чтобы вызвать этот маршрут, запрос должен иметь куку или Bearer Token с ролью `ADMIN` и контекстом проекта.
