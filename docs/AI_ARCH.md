# Smmplan: AI Architecture Guide (March 2026)

Этот файл предназначен для предоставления быстрого контекста AI-агентам и разработчикам.

## Core Pillars
1. **Multi-Project Isolation**: Все данные (сервисы, заказы) изолированы по `projectId`. Глобальный админ имеет доступ ко всему, локальные админы — только к своим проектам.
2. **Server-First Architecture**: Next.js 16 + React 19. Основная логика в Server Components и Server Actions.
3. **Pluggable Providers**: Универсальная система провайдеров (`src/services/providers`).

## Module Map
- `src/services/finance`: Расчет цен, валюты (RUB/USD), транзакции.
- `src/services/orders`: Процессинг заказов, интеграция с провайдерами.
- `src/services/cms`: Динамический конструктор контента и виджетов.
- `src/services/intelligence`: Анализ линков, анти-фрод, умный маппинг.

## Architectural Boundaries (Cruiser Rules)
- **UI -> Services**: Прямой доступ к Prisma из UI запрещен.
- **Cross-Service**: Общение между сервисами только через публичные методы.

## Tech Stack (2026)
- Next.js 16.0.10 (Turbopack)
- React 19.0.0
- Tailwind CSS 4.0.0
- Prisma 5.22.0
- Redis (Upstash) for Rate Limiting
