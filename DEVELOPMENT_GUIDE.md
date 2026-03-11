# SMMPlan Development Guide (Updated 2026)

## 🏗 Инфраструктура
Проект работает в Docker-контейнерах для обеспечения идентичности окружений разработки и продакшена.

### Команды запуска
- `docker-compose up -d --build` — полная пересборка и запуск.
- `docker-compose restart app` — быстрый перезапуск Next.js сервера.
- `docker logs smmplan-app -f` — просмотр логов в реальном времени.

### Стек технологий
- **Frontend**: Next.js 16 (App Router), Tailwind CSS, Lucide Icons.
- **Backend**: Next.js API Routes, Prisma ORM (PostgreSQL).
- **Bot**: Telegraf.js (TypeScript).
- **Execution**: `tsx` (TypeScript Execution) для скриптов и бота.
- **State Management**: SWR (на клиенте), Redis (очереди и сессии).

---

## 🛠 Ключевые сервисы (Business Logic)

### 1. LinkService (`src/services/link.service.ts`)
Единый центр обработки ссылок. 
- `analyze(link)`: Определяет платформу и тип цели.
- `validate(link, platform, targetType)`: Проверяет соответствие ссылки выбранной услуге.

### 2. ProviderService (`src/services/provider.service.ts`)
Универсальный адаптер для работы с SMM-провайдерами (VexBoost, Stream-Promotion).
- Автоматически синхронизирует услуги.
- Обрабатывает создание заказов и проверку статусов.

### 3. SmartAnalyzerService (`src/services/smart-analyzer.service.ts`)
Использует эвристические алгоритмы (и в будущем ML) для автоматического маппинга импортируемых услуг.

---

## 🔐 Администрирование
- **Admin Panel**: Доступна по адресу `/admin`.
- **Proxy (Middleware)**: Настроено в `src/proxy.ts`, защищает роуты `/admin` и `/api/admin`.
- **Ledger (Журнал)**: Все финансовые операции (пополнения, списания, возвраты) ДОЛЖНЫ записываться в таблицу `Transaction` и `LedgerEntry`.

---

## 📱 Клиентская часть (Roadmap)
Запланирован переход от Telegram Mini App к полноценному веб-сайту на базе Next.js, который будет использовать ту же базу данных и API, что и бот.
