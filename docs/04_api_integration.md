# Интеграция с VexBoost API

## 🔗 Основные эндпоинты
Базовый URL: `https://vexboost.ru/api/v2`

### 1. Получение списка услуг
- **Query**: `?action=services&key={{API_KEY}}`
- **Использование**: Синхронизация каталога и цен.

### 2. Создание заказа
- **Method**: POST
- **Params**:
  - `action`: `add`
  - `service`: ID услуги
  - `link`: Ссылка
  - `quantity`: Количество
- **Response**: `{"order": "12345"}` или `{"error": "..."}`

### 3. Статус заказа
- **Query**: `?action=status&order={{ORDER_ID}}&key={{API_KEY}}`
- **Response**:
  - `status`: Pending, Processing, Completed, Canceled, Partial.
  - `charge`: Итоговая сумма.
  - `start_count`: Начальное кол-во.
  - `remains`: Остаток.

### 4. Проверка баланса (на стороне провайдера)
- **Query**: `?action=balance&key={{API_KEY}}`
- **Использование**: Мониторинг средств на аккаунте-доноре для уведомления администратора.

## 🛡 Безопасность
- API ключ VexBoost должен храниться строго в переменных окружения (`.env`) и никогда не попадать в клиентский код.
- Все запросы к VexBoost должны идти через наш бэкенд (Next.js API Routes).
