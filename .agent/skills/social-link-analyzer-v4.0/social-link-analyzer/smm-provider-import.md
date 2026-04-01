# Умный импорт от провайдеров SMM-услуг

Документ описывает правила и алгоритмы для автоматического импорта и обработки данных от провайдеров SMM-услуг (Social Media Marketing).

---

## 1. Обзор

### 1.1 Цель документа

Обеспечить автоматическую интеграцию с SMM-провайдерами для:
- Определения типа услуги по ссылке
- Валидации ссылок перед заказом
- Нормализации данных для API
- Автоматического выбора сервиса

### 1.2 Типичная архитектура SMM-панели

```
┌──────────────────────────────────────────────────────────────┐
│                      SMM-ПАНЕЛЬ                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐    │
│   │   Клиент    │────▶│   Анализатор│────▶│   Выбор     │    │
│   │   (ссылка)  │     │   ссылок    │     │   сервиса   │    │
│   └─────────────┘     └─────────────┘     └─────────────┘    │
│                              │                    │           │
│                              ▼                    ▼           │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐    │
│   │   Результат│◀────│   Валидация │◀────│   Провайдер │    │
│   │   заказа   │     │             │     │     API     │    │
│   └─────────────┘     └─────────────┘     └─────────────┘    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Форматы данных провайдеров

### 2.1 Стандартный API-формат

Большинство SMM-панелей используют REST API с JSON:

```json
// Запрос на создание заказа
POST /api/v2

{
  "key": "YOUR_API_KEY",
  "action": "add",
  "service": 123,
  "link": "https://platform.com/object",
  "quantity": 1000,
  "runs": 1,
  "interval": 0
}

// Ответ
{
  "order": 12345
}
```

### 2.2 Типовые endpoints

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/v2` | GET | Получение баланса |
| `/api/v2` | GET | Список сервисов |
| `/api/v2` | POST | Создание заказа |
| `/api/v2` | GET | Статус заказа |
| `/api/v2` | GET | Статус нескольких заказов |

### 2.3 Параметры запроса

| Параметр | Обязательный | Описание |
|----------|--------------|----------|
| `key` | Да | API ключ |
| `action` | Да | `add`, `status`, `services`, `balance` |
| `service` | Да* | ID сервиса |
| `link` | Да* | Ссылка на объект |
| `quantity` | Да* | Количество |
| `runs` | Нет | Количество запусков (drip feed) |
| `interval` | Нет | Интервал между запусками (минуты) |
| `custom_comments` | Нет | Массив комментариев |
| `usernames` | Нет | Список usernames (для некоторых сервисов) |

---

## 3. Мэппинг услуг по типам объектов

### 3.1 Структура мэппинга

```yaml
# Для каждой платформы определены типы объектов и доступные услуги

vk:
  # Профиль пользователя
  profile:
    services:
      - id: followers
        names: ["Подписчики", "Followers", "Подписчики в профиль"]
        input_type: "profile_link"
        min: 100
        max: 100000
        
      - id: friends
        names: ["Друзья", "Friends", "Заявки в друзья"]
        input_type: "profile_link"
        min: 50
        max: 10000
  
  # Сообщество/группа
  group:
    services:
      - id: members
        names: ["Участники", "Members", "Подписчики в группу"]
        input_type: "group_link"
        min: 100
        max: 50000
        
      - id: friends_group
        names: ["Друзья в группу"]
        input_type: "group_link"
        min: 10
        max: 5000
  
  # Пост на стене
  wall_post:
    services:
      - id: likes
        names: ["Лайки", "Likes", "Нравится"]
        input_type: "post_link"
        min: 50
        max: 50000
        
      - id: comments
        names: ["Комментарии", "Comments"]
        input_type: "post_link"
        min: 10
        max: 1000
        
      - id: reposts
        names: ["Репосты", "Reposts", "Поделиться"]
        input_type: "post_link"
        min: 50
        max: 10000
  
  # Видео
  video:
    services:
      - id: views
        names: ["Просмотры", "Views"]
        input_type: "video_link"
        min: 500
        max: 1000000
        
      - id: likes
        names: ["Лайки на видео"]
        input_type: "video_link"
        min: 50
        max: 10000
  
  # VK Клип
  clip:
    services:
      - id: views
        names: ["Просмотры клипов"]
        input_type: "clip_link"
        min: 500
        max: 500000
        
      - id: likes
        names: ["Лайки на клипы"]
        input_type: "clip_link"
        min: 100
        max: 20000
```

### 3.2 Полный мэппинг по платформам

#### Instagram

```yaml
instagram:
  profile:
    services:
      - id: followers
        names: ["Подписчики", "Followers"]
        input_type: "profile_link"
        
      - id: followers_hq
        names: ["Подписчики HQ", "Качественные подписчики"]
        input_type: "profile_link"
  
  post:
    services:
      - id: likes
        names: ["Лайки", "Likes"]
        input_type: "post_link"
        
      - id: comments
        names: ["Комментарии"]
        input_type: "post_link"
        
      - id: saves
        names: ["Сохранения", "Saves"]
        input_type: "post_link"
        
      - id: reach
        names: ["Охваты", "Reach"]
        input_type: "post_link"
  
  reel:
    services:
      - id: views
        names: ["Просмотры Reels"]
        input_type: "reel_link"
        
      - id: likes
        names: ["Лайки на Reels"]
        input_type: "reel_link"
  
  story:
    services:
      - id: views
        names: ["Просмотры Stories"]
        input_type: "story_link"
```

#### TikTok

```yaml
tiktok:
  profile:
    services:
      - id: followers
        names: ["Подписчики TikTok"]
        input_type: "profile_link"
  
  video:
    services:
      - id: views
        names: ["Просмотры", "Views"]
        input_type: "video_link"
        
      - id: likes
        names: ["Лайки", "Likes", "Сердечки"]
        input_type: "video_link"
        
      - id: comments
        names: ["Комментарии"]
        input_type: "video_link"
        
      - id: shares
        names: ["Репосты", "Shares"]
        input_type: "video_link"
  
  live:
    services:
      - id: viewers
        names: ["Зрители на трансляции", "Live Viewers"]
        input_type: "live_link"
        
      - id: likes_live
        names: ["Лайки на трансляции"]
        input_type: "live_link"
```

#### YouTube

```yaml
youtube:
  channel:
    services:
      - id: subscribers
        names: ["Подписчики", "Subscribers"]
        input_type: "channel_link"
  
  video:
    services:
      - id: views
        names: ["Просмотры", "Views"]
        input_type: "video_link"
        
      - id: likes
        names: ["Лайки", "Likes"]
        input_type: "video_link"
        
      - id: comments
        names: ["Комментарии"]
        input_type: "video_link"
  
  shorts:
    services:
      - id: views_shorts
        names: ["Просмотры Shorts"]
        input_type: "shorts_link"
        
      - id: likes_shorts
        names: ["Лайки на Shorts"]
        input_type: "shorts_link"
```

#### Telegram

```yaml
telegram:
  channel:
    services:
      - id: members
        names: ["Подписчики канала", "Channel Members"]
        input_type: "channel_link"
        
      - id: post_views
        names: ["Просмотры постов"]
        input_type: "post_link"
  
  chat:
    services:
      - id: members_chat
        names: ["Участники чата"]
        input_type: "chat_link"
  
  post:
    services:
      - id: reactions
        names: ["Реакции", "Reactions"]
        input_type: "post_link"
        
      - id: views
        names: ["Просмотры"]
        input_type: "post_link"
```

---

## 4. Алгоритм определения услуги

### 4.1 Основной алгоритм

```javascript
function detectService(url, providerServices) {
  // 1. Анализ ссылки
  const analysis = analyzeUrl(url);
  
  if (!analysis.success) {
    return { error: analysis.error };
  }
  
  // 2. Получить тип объекта
  const { platform, type, ids } = analysis.data;
  
  // 3. Найти доступные услуги для типа
  const availableServices = SERVICE_MAPPING[platform]?.[type]?.services || [];
  
  if (availableServices.length === 0) {
    return { error: 'NO_SERVICES_FOR_TYPE' };
  }
  
  // 4. Сопоставить с сервисами провайдера
  const matchedServices = [];
  
  for (const avail of availableServices) {
    const providerService = providerServices.find(s => 
      avail.names.some(name => 
        s.name.toLowerCase().includes(name.toLowerCase())
      )
    );
    
    if (providerService) {
      matchedServices.push({
        service_id: avail.id,
        service_name: avail.names[0],
        provider_service_id: providerService.service,
        provider_service_name: providerService.name,
        rate: providerService.rate,
        min: providerService.min,
        max: providerService.max
      });
    }
  }
  
  // 5. Вернуть результаты
  return {
    platform,
    type,
    ids,
    matched_services: matchedServices,
    recommended_service: matchedServices[0] || null
  };
}
```

### 4.2 Приоритизация услуг

```javascript
function prioritizeServices(matchedServices, quantity) {
  return matchedServices
    // Фильтрация по количеству
    .filter(s => quantity >= s.min && quantity <= s.max)
    // Сортировка по приоритету
    .sort((a, b) => {
      // 1. Предпочтение "родным" сервисам (не HQ)
      const aIsHq = a.service_name.toLowerCase().includes('hq');
      const bIsHq = b.service_name.toLowerCase().includes('hq');
      if (aIsHq !== bIsHq) return aIsHq ? 1 : -1;
      
      // 2. Предпочтение более дешёвым
      return parseFloat(a.rate) - parseFloat(b.rate);
    });
}
```

---

## 5. Валидация перед заказом

### 5.1 Обязательные проверки

```javascript
async function validateForOrder(url, serviceId, quantity, providerApi) {
  const errors = [];
  const warnings = [];
  
  // 1. Валидация формата ссылки
  const analysis = analyzeUrl(url);
  if (!analysis.success) {
    errors.push({
      code: 'INVALID_LINK',
      message: analysis.error
    });
    return { valid: false, errors, warnings };
  }
  
  // 2. Проверка соответствия сервиса
  const serviceInfo = await providerApi.getService(serviceId);
  if (!serviceInfo) {
    errors.push({
      code: 'SERVICE_NOT_FOUND',
      message: `Сервис ${serviceId} не найден`
    });
    return { valid: false, errors, warnings };
  }
  
  // 3. Проверка количества
  if (quantity < serviceInfo.min) {
    errors.push({
      code: 'QUANTITY_TOO_LOW',
      message: `Минимальное количество: ${serviceInfo.min}`
    });
  }
  
  if (quantity > serviceInfo.max) {
    errors.push({
      code: 'QUANTITY_TOO_HIGH',
      message: `Максимальное количество: ${serviceInfo.max}`
    });
  }
  
  // 4. Проверка доступности контента
  const contentCheck = await checkContentAvailability(url);
  if (!contentCheck.available) {
    errors.push({
      code: 'CONTENT_UNAVAILABLE',
      message: contentCheck.reason
    });
  }
  
  // 5. Проверка статуса (для Live)
  if (analysis.data.type === 'live') {
    const liveStatus = await checkLiveStatus(url);
    if (!liveStatus.isLive) {
      warnings.push({
        code: 'LIVE_NOT_ACTIVE',
        message: 'Трансляция не активна'
      });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    analysis: analysis.data
  };
}
```

### 5.2 Проверка доступности контента

```javascript
async function checkContentAvailability(url) {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      redirect: 'follow',
      timeout: 10000
    });
    
    if (response.status === 404) {
      return { available: false, reason: 'Контент удалён' };
    }
    
    if (response.status === 403) {
      return { available: false, reason: 'Контент приватный или ограничен' };
    }
    
    if (!response.ok) {
      return { available: false, reason: `HTTP ошибка: ${response.status}` };
    }
    
    return { available: true };
  } catch (error) {
    return { available: false, reason: error.message };
  }
}
```

### 5.3 Проверка статуса Live

```javascript
async function checkLiveStatus(url) {
  const analysis = analyzeUrl(url);
  
  // TikTok Live
  if (analysis.data.platform === 'tiktok' && analysis.data.type === 'live') {
    // Проверить через TikTok API или веб-скрейпинг
    try {
      const response = await fetch(url);
      const html = await response.text();
      
      const isLive = html.includes('LIVE') || html.includes('"liveRoom"');
      return { isLive, platform: 'tiktok' };
    } catch {
      return { isLive: false, error: 'Не удалось проверить статус' };
    }
  }
  
  // Twitch Live
  if (analysis.data.platform === 'twitch') {
    // Использовать Twitch API
    // ...
  }
  
  return { isLive: true }; // По умолчанию считаем активным
}
```

---

## 6. Нормализация данных для API

### 6.1 Подготовка запроса

```javascript
function prepareOrderRequest(analysis, serviceId, quantity, options = {}) {
  const { platform, type, ids, normalized_url } = analysis;
  
  const request = {
    key: process.env.SMM_API_KEY,
    action: 'add',
    service: serviceId,
    link: normalized_url,
    quantity: quantity
  };
  
  // Добавить специфичные параметры
  if (options.custom_comments) {
    request.custom_comments = options.custom_comments.join('\n');
  }
  
  if (options.usernames) {
    request.usernames = options.usernames.join('\n');
  }
  
  // Drip feed
  if (options.drip_feed) {
    request.runs = options.runs || 1;
    request.interval = options.interval || 0;
  }
  
  return request;
}
```

### 6.2 Трансформация ответа

```javascript
function transformProviderResponse(response, orderData) {
  return {
    success: true,
    order: {
      id: response.order,
      service_id: orderData.service,
      link: orderData.link,
      quantity: orderData.quantity,
      platform: orderData.platform,
      type: orderData.type,
      created_at: new Date().toISOString(),
      status: 'pending'
    }
  };
}
```

---

## 7. Обработка специальных случаев

### 7.1 Комментарии с текстом

```javascript
// Для сервисов комментариев с кастомным текстом
function prepareCommentOrder(url, comments, serviceId) {
  const analysis = analyzeUrl(url);
  
  if (analysis.data.type !== 'post' && 
      analysis.data.type !== 'video' && 
      analysis.data.type !== 'wall_post') {
    return { error: 'Комментарии поддерживаются только для постов и видео' };
  }
  
  return {
    key: API_KEY,
    action: 'add',
    service: serviceId,
    link: analysis.data.normalized_url,
    quantity: comments.length,
    custom_comments: comments.join('\n')
  };
}
```

### 7.2 Реакции Telegram

```javascript
// Для Telegram реакций
function prepareReactionOrder(url, reaction, quantity, serviceId) {
  const analysis = analyzeUrl(url);
  
  if (analysis.data.platform !== 'telegram') {
    return { error: 'Реакции доступны только для Telegram' };
  }
  
  if (analysis.data.type !== 'post') {
    return { error: 'Реакции поддерживаются только для постов в каналах' };
  }
  
  return {
    key: API_KEY,
    action: 'add',
    service: serviceId,
    link: analysis.data.normalized_url,
    quantity: quantity,
    reaction: reaction // '👍', '❤️', '🔥', etc.
  };
}
```

### 7.3 Drip Feed заказы

```javascript
// Для постепенного выполнения
function prepareDripFeedOrder(url, totalQuantity, runs, interval, serviceId) {
  const quantityPerRun = Math.floor(totalQuantity / runs);
  
  return {
    key: API_KEY,
    action: 'add',
    service: serviceId,
    link: url,
    quantity: quantityPerRun,
    runs: runs,
    interval: interval // в минутах
  };
}
```

---

## 8. Интеграция с провайдерами

### 8.1 Универсальный клиент

```javascript
class SMMProviderClient {
  constructor(apiUrl, apiKey) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }
  
  async request(params) {
    const formData = new URLSearchParams({
      key: this.apiKey,
      ...params
    });
    
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });
    
    return response.json();
  }
  
  async getBalance() {
    return this.request({ action: 'balance' });
  }
  
  async getServices() {
    return this.request({ action: 'services' });
  }
  
  async addOrder(service, link, quantity, options = {}) {
    return this.request({
      action: 'add',
      service,
      link,
      quantity,
      ...options
    });
  }
  
  async getOrderStatus(orderId) {
    return this.request({
      action: 'status',
      order: orderId
    });
  }
  
  async getMultipleOrdersStatus(orderIds) {
    return this.request({
      action: 'status',
      orders: orderIds.join(',')
    });
  }
}
```

### 8.2 Мульти-провайдер

```javascript
class MultiProviderManager {
  constructor() {
    this.providers = new Map();
  }
  
  addProvider(name, client) {
    this.providers.set(name, client);
  }
  
  async findBestService(platform, type, serviceName) {
    const results = [];
    
    for (const [name, client] of this.providers) {
      const services = await client.getServices();
      
      const matched = services.find(s => 
        s.name.toLowerCase().includes(serviceName.toLowerCase()) &&
        this.serviceMatchesPlatform(s, platform)
      );
      
      if (matched) {
        results.push({
          provider: name,
          service: matched,
          rate: parseFloat(matched.rate)
        });
      }
    }
    
    // Сортировать по цене
    return results.sort((a, b) => a.rate - b.rate);
  }
  
  serviceMatchesPlatform(service, platform) {
    const platformKeywords = {
      vk: ['vk', 'вк', 'вконтакте'],
      instagram: ['instagram', 'insta', 'инста'],
      tiktok: ['tiktok', 'тикток'],
      youtube: ['youtube', 'ютуб', 'yt'],
      telegram: ['telegram', 'телеграм', 'tg'],
      facebook: ['facebook', 'fb', 'фейсбук'],
      twitter: ['twitter', 'x.com', 'твиттер']
    };
    
    const keywords = platformKeywords[platform] || [];
    const serviceName = service.name.toLowerCase();
    
    return keywords.some(kw => serviceName.includes(kw));
  }
}
```

---

## 9. Пакетная обработка

### 9.1 Массовый анализ

```javascript
async function batchAnalyze(urls) {
  const results = [];
  
  for (const url of urls) {
    try {
      const analysis = analyzeUrl(url);
      results.push({
        url,
        success: analysis.success,
        data: analysis.data || null,
        error: analysis.error || null
      });
    } catch (error) {
      results.push({
        url,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}
```

### 9.2 Массовый заказ

```javascript
async function batchOrder(orders, providerClient) {
  const results = [];
  
  for (const order of orders) {
    // Валидация
    const validation = await validateForOrder(
      order.url, 
      order.service_id, 
      order.quantity,
      providerClient
    );
    
    if (!validation.valid) {
      results.push({
        url: order.url,
        success: false,
        errors: validation.errors
      });
      continue;
    }
    
    // Создание заказа
    try {
      const response = await providerClient.addOrder(
        order.service_id,
        validation.analysis.normalized_url,
        order.quantity,
        order.options
      );
      
      results.push({
        url: order.url,
        success: true,
        order_id: response.order
      });
    } catch (error) {
      results.push({
        url: order.url,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}
```

---

## 10. Мониторинг и отчётность

### 10.1 Статусы заказов

| Статус | Описание |
|--------|----------|
| `pending` | Ожидает обработки |
| `processing` | В обработке |
| `in_progress` | Выполняется |
| `completed` | Завершён |
| `partial` | Частично выполнен |
| `cancelled` | Отменён |
| `refunded` | Возврат средств |

### 10.2 Webhook уведомления

```javascript
// Пример настройки webhook для уведомлений
const webhookConfig = {
  url: 'https://your-server.com/webhook/smm',
  events: ['order.completed', 'order.cancelled', 'order.partial'],
  secret: 'your_webhook_secret'
};

// Обработка webhook
function handleWebhook(payload, signature) {
  // Верификация подписи
  if (!verifySignature(payload, signature, webhookConfig.secret)) {
    return { error: 'Invalid signature' };
  }
  
  const { event, order_id, status, remains } = payload;
  
  switch (event) {
    case 'order.completed':
      // Обновить статус в БД
      updateOrderStatus(order_id, 'completed');
      notifyUser(order_id, 'Заказ завершён');
      break;
      
    case 'order.partial':
      // Частичное выполнение
      updateOrderStatus(order_id, 'partial', { remains });
      notifyUser(order_id, `Частичное выполнение. Осталось: ${remains}`);
      break;
      
    case 'order.cancelled':
      // Отмена
      updateOrderStatus(order_id, 'cancelled');
      refundUser(order_id);
      break;
  }
  
  return { success: true };
}
```

---

## 11. Примеры использования

### 11.1 Автоматический выбор сервиса

```javascript
// Вход: ссылка и желаемое действие
const url = 'https://www.instagram.com/p/CgBxesYIjZ/';
const action = 'likes';
const quantity = 1000;

// Анализ
const analysis = analyzeUrl(url);
// -> { platform: 'instagram', type: 'post', ... }

// Поиск сервиса
const services = await findBestService('instagram', 'post', action);
// -> [{ provider: 'provider1', service: {...}, rate: 0.50 }, ...]

// Создание заказа
const order = await providerClient.addOrder(
  services[0].service.service,
  analysis.data.normalized_url,
  quantity
);
```

### 11.2 Массовый импорт из CSV

```javascript
// CSV формат: link,service_name,quantity
async function importFromCSV(csvContent, providerClient) {
  const lines = csvContent.split('\n').slice(1); // Пропустить заголовок
  const results = [];
  
  for (const line of lines) {
    const [link, serviceName, quantity] = line.split(',');
    
    const analysis = analyzeUrl(link.trim());
    if (!analysis.success) {
      results.push({ link, error: 'Invalid link' });
      continue;
    }
    
    const services = await findBestService(
      analysis.data.platform,
      analysis.data.type,
      serviceName.trim()
    );
    
    if (services.length === 0) {
      results.push({ link, error: 'Service not found' });
      continue;
    }
    
    const order = await providerClient.addOrder(
      services[0].service.service,
      analysis.data.normalized_url,
      parseInt(quantity)
    );
    
    results.push({ link, order_id: order.order });
  }
  
  return results;
}
```

---

*Документ версии 3.0 от 2026-03-27*
