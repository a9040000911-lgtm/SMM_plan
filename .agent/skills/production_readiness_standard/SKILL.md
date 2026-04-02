---
name: production_readiness_standard
description: "Smmplan Production Readiness Review (PRR) — Строгий стандарт деплоя, подготовки репозитория, контейнеров и базы данных по стандартам Google SRE и 12-Factor. Обеспечивает выживаемость инфраструктуры без GitHub Actions пайплайнов (Local Build to Prod)."
---

# 🛡️ Smmplan: Production Readiness Standard (PRR)

Этот навык ОБУЧАЕТ Агента и Разработчика тому, как правильно готовить Smmplan к выходу в Production, выявлять "скрытые" зависимости и безопасно выполнять деплой через метод **"Локальной Сборки с выгрузкой в Production" (Local Build Push)**. Игнорирование этого документа может привести к 502/429 ошибкам, рассинхронизации Prisma или повреждению Nginx Volumes.

## 📌 1. Архитектурный Аудит до Сборки (Pre-flight Review)

Агент ОБЯЗАН провести эти 3 проверки перед началом процесса выкатки:

### А. Принцип "Graceful Fallback" для Middleware
Если код использует сторонние API на Edge (например `Upstash Redis` для Rate Limiter) — **категорически запрещено** использовать режим "Fail-Closed" (блокировать всех при недоступности Redis).
* **Проверка:** Найдите все внешние API в `src/middleware.ts` и `src/instrumentation.ts` и убедитесь, что при потере сети они имеют in-memory fallback (например, `new Map()`), а инициализация (например, Sentry) завернута в `if (process.env.SENTRY_DSN)`.

### Б. Синхронизация Prisma (База Данных)
* **Правило:** Ни один контейнер Next.js не имеет права переключать на себя трафик, пока схема PostgreSQL не обновлена. 
* Ошибка `P2022 The column does not exist` возникает, если выкатить код до миграции базы данных.

### В. Запрет на кеширование статики через Volumes (`next_static`)
* Хэши файлов `/_next/static/*` меняются при КАЖДОЙ новой сборке Docker.
* **Правило Nginx:** `location /_next/static` НЕ ДОЛЖЕН отдаваться из физической папки `root /usr/share/nginx/html`. Трафик за статикой должен быть проксирован внутрь Next.js: `proxy_pass http://nextjs;`. Next.js сам прекрасно отдаст свою статику из памяти.

## 🚀 2. Подготовка Локального Репозитория к Сборке

Для локальной архитектуры выкатки (когда `builder` работает на ноутбуке/компьютере разработчика, а `runner` пересылается на сервер по SSH), алгоритм должен быть идеален:

1. **Заморозка кода:** Никаких грязных файлов. `git status` должен быть чист (хотя бы закоммитьте хотфиксы локально).
2. **Проверка `.env.production` (Секреты):** Убедитесь, что боевые ключи не вшиты в локальные файлы `next.config.mjs` и не попадают в Docker-слой `builder` (используйте GitHub Secrets для CI, либо не передавайте `.env.local` в Docker).
3. **Чистка Кэша:** Если вы меняли Tailwind-конфиг или `prisma.schema`, локально рекомендуют вычистить папку `.next/` перед Docker-сборкой, чтобы Webpack не сошел с ума.

## 📦 3. Протокол Локального Деплоя (The Push-to-Prod Script)

Ниже описан ЗОЛОТОЙ СТАНДАРТ (World Standard) выкатки для инфраструктуры без непрерывной интеграции (CI/CD GitHub Registry). Он реализуется через PowerShell Script `deploy-local-to-prod.ps1`:

### Фаза А: Local Build (Без нагрузки на сервер)
Сервер Smmplan с 8ГБ ОЗУ выживет при сборке Docker Compose, но в мире SRE **Production-сервера лишены компиляторов (Zero-Compilation Node)**.
Сборка происходит локально: `docker build --target runner -t smmplan-app:latest .`

### Фаза Б: Транспорт Ледяного Образа (Cold Migration)
Образ сжимается: `docker save smmplan-app:latest | gzip > smmplan.tar.gz`
И пересылается на Production: `scp smmplan.tar.gz root@89.23.98.202:/root/`

### Фаза В: Инъекция Образа (Hot Reload)
На сервере мы: `docker load < smmplan.tar.gz`
Затем, **КРИТИЧЕСКИ ВАЖНЫЙ ШАГ (DB Pre-Sync)**:
Перед перезагрузкой старого контейнера мы обязаны выполнить `npx prisma db push --accept-data-loss` или `migrate deploy` **из нового образа во временном контейнере**:
`docker run --rm --env-file /root/smmplan/.env --network smmplan_default smmplan-app:latest npx prisma db push --skip-generate --accept-data-loss`

### Фаза Г: Мягкое Переключение (Zero-Downtime Rolling Update)
Используем `--no-deps`, чтобы пересоздать только веб-контейнеры, не трогая Nginx и Redis (которые хранят сессии):
`docker-compose -f docker-compose.prod.yml up -d --no-deps app`

## 📋 Чеклист Рольбэка (Как откатиться, если всё сгорело)

Если после скрипта выдает `502 Bad Gateway` (Healthcheck API проваливается):
1. **Проверьте логи свежего контейнера:** `docker logs smmplan-app-3 --tail 100` (Скорее всего найдете отложенный Sentry/Prisma краш).
2. **Найдите старый образ:** `docker images | grep smmplan-app` покажет затертые теги `<none>`. Найдите ID прошлой версии.
3. **Верните ID в docker-compose.prod.yml** (в поле image) и запустите `docker compose up -d --no-deps app`.
4. **Откат БД:** Практически невозможен без дампа. Поэтому миграции из Шага 1 должны подчиняться закону **Expand & Contract**.

> **[Конец спецификации Production Readiness Review]**
