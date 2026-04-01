# 🏛 Архитектура: Строительные Блоки (Building Blocks)

На втором уровне C4 модели (Контейнеры) мы декомпозируем ядро **Next.js** на смысловые логические блоки (Домены). 

## C4 Диаграмма: Контейнеры (Mermaid.js)

```mermaid
C4Container
    title Строительные блоки (Внутренняя структура)

    System_Boundary(smmplan, "Next.js 16 Application (App Router)") {
        
        Container(frontend_app, "Neuro-UX Frontend", "React 19 + Tailwind 4", "Клиентские страницы (UI), оформление заказов, лендинги, дашборд Analytics.")
        
        Container(api_gateway, "API Route Handlers", "Next.js Route API", "Проксирование, Zod-валидация и обработка входящих запросов от фронта и Webhooks.")
        
        Container_Boundary(core_services, "Core Services (Business Logic)") {
            Component(order_processor, "OrderProcessor", "TypeScript Service", "Ядро маршрутизации: списывает деньги, рассчитывает маржу, передает ProviderService.")
            Component(provider_service, "ProviderService", "TypeScript Service", "Интерфейс делегирования SMM-провайдерам (с логикой Failover).")
            Component(loyalty_engine, "Loyalty & B2B Engine", "TypeScript Service", "Кэшбеки, скидочные сетки, ачивки, партнерская программа.")
        }
    }
    
    ContainerDb(database, "PostgreSQL", "PostgreSQL 15+", "Хранит пользователей, балансы, заказы (с изоляцией проектов - projectId).")
    ContainerDb(prisma, "Prisma ORM", "ORM", "Пул соединений с БД, строгая типизация объектов.")

    Rel(frontend_app, api_gateway, "REST / Server Actions", "JSON")
    Rel(api_gateway, core_services, "Вызывает сервисы напрямую", "TypeScript Call")
    
    Rel(core_services, prisma, "SQL Query", "Prisma Client")
    Rel(prisma, database, "TCP/IP", "PostgreSQL Protocol")

```

## Описание Ключевых Контейнеров

### 1. Neuro-UX Frontend
Фронтенд ориентирован на **максимальную конверсию**: 
- Используются микро-анимации состояний `Loading`, `Success`.
- Нет долгих перезагрузок — всё обрабатывается через `React Transitions` и оптимистичные UI обновления (Optimistic Updates).
- Архитектура предотвращения конфликтов элементов (Layout Collision Prevention) с крупной типографикой.

### 2. Ядро Заказов (OrderProcessor)
Самый критически важный сервис. Его задача: 
1. Принять заказ от Zod-валидатора.
2. Проверить баланс клиента.
3. Рассчитать Unit-экономику для текущего курса.
4. Выбрать провайдера из каталога по Priority (настройка Failover).
5. Создать `Transaction` в БД.
6. Вызвать внешнее API. 
7. **Fall-back механизм:** Если API провайдера лежит, деньги клиента возвращаются или выкидывается Error, но база данных остается консистентной благодаря механизму транзакций.

### 3. Изоляция Проектов (Multi-Project Database)
Чтобы запускать несколько разных бизнесов на одном ядре (Например: smm.rf и smm.com), все критичные таблицы в базе имеют `projectId`. Сервисы обязаны применять `where: { projectId }` перед чтением и записью. Если это не сделать, произойдет утечка (Information Disclosure).
