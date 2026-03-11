# Техническая архитектура SMMPlan (v2.0)

## 📚 Стек технологий

- **Frontend & Admin**: Next.js 15 (App Router), Tailwind CSS, Lucide.
- **Backend (Core)**: Next.js API Routes (Server Actions для админки).
- **Telegram Interface**: Telegraf.js (TypeScript) + Redis Sessions.
- **Database**: PostgreSQL (Prisma ORM).
- **Queues**: Redis + BullMQ (для обработки заказов и синхронизации).
- **AI/ML Integration**: Heuristic Analyzer + Google Gemini API.

---

## 🏗 Модульная структура

### 1. Unified Interface Layer
- **Telegram Bot**: Мгновенный доступ, уведомления.
- **Admin Panel**: Глубокое управление платформой, аналитика, финансовый аудит.
- **Client Website (Planned)**: Полноразмерная Responsive платформа для Desktop/Mobile.

### 2. Business Services (Shared)
- `LinkService`: Глобальный анализатор и валидатор ссылок.
- `ProviderService`: Адаптеры для внешних SMM-провайдеров.
- `SmartSync`: Система поддержания актуальности каталога и маржи.
- `LedgerService`: Отказоустойчивый финансовый журнал транзакций.

### 3. Data Flow
1. **User Action** (Bot/Web) -> **LinkService** (Validation) -> **Queue** (Redis).
2. **Worker** -> **ProviderService** (API Add) -> **External ID** (Store).
3. **SmartSync** -> **ProviderService** (API Status) -> **Balance/Order Updates**.

---

## 🔄 Схема работы с провайдерами
- **Pull**: Регулярное обновление цен и списка услуг.
- **Markup**: Автоматическая наценка через Markup Engine.
- **Safety**: Margin Guard — остановка заказов при резком росте закупочной цены.