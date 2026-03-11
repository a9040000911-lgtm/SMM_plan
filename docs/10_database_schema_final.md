# Схема Базы Данных (Prisma Schema Design)

## 1. Users (Пользователи)
- `id`: UUID (Primary Key)
- `tg_id`: BigInt (Unique) — ID пользователя в Telegram
- `username`: String (Optional)
- `balance`: Decimal (Default: 0.00) — Текущий баланс
- `spent`: Decimal (Default: 0.00) — Всего потрачено (для системы лояльности/скидок)
- `role`: Enum (USER, ADMIN, RESELLER)
- `created_at`: DateTime

## 2. InternalServices (Наши Тарифы)
- `id`: String (Unique, e.g., "tg_sub_premium")
- `platform`: Enum (TELEGRAM, INSTAGRAM, VK, etc.)
- `category`: Enum (SUBSCRIBERS, LIKES, VIEWS, etc.)
- `name`: String (Отображаемое имя, например, "Премиум")
- `description`: Text
- `geo`: String (RU, CIS, WORLD)
- `provider_service_id`: Int (Связь с ID провайдера)
- `price_per_1000`: Decimal (Наша цена для клиента)
- `min_qty`: Int
- `max_qty`: Int
- `is_active`: Boolean
- `rating`: Float (0-5.0)

## 3. ProviderServices (Сырые данные от VexBoost)
- `id`: Int (ID в системе провайдера)
- `name`: String
- `raw_price`: Decimal (Цена закупки)
- `raw_data`: JSON (Полный ответ от API)
- `last_updated`: DateTime

## 4. Orders (Заказы)
- `id`: UUID
- `user_id`: UUID (Связь с User)
- `internal_service_id`: String (Связь с InternalServices)
- `external_id`: String (ID заказа у провайдера)
- `link`: String
- `quantity`: Int
- `total_price`: Decimal
- `status`: Enum (PENDING, PROCESSING, COMPLETED, PARTIAL, CANCELED)
- `remains`: Int
- `created_at`: DateTime

## 5. Transactions (Платежи)
- `id`: UUID
- `user_id`: UUID
- `amount`: Decimal
- `type`: Enum (DEPOSIT, WITHDRAW, REFUND)
- `provider`: Enum (YOOKASSA, ROBOKASSA)
- `external_id`: String (ID транзакции в платежке)
- `status`: Enum (PENDING, SUCCESS, FAILED)
- `created_at`: DateTime

## 6. ProviderLogs (Watchdog)
- `id`: Int
- `service_id`: Int
- `event_type`: Enum (PRICE_CHANGE, STATUS_CHANGE, DESC_CHANGE)
- `old_value`: String
- `new_value`: String
- `created_at`: DateTime
