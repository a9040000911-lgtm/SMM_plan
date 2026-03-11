---
description: Как запустить проект в Docker в продакшен режиме
---

Для запуска всей системы (Next.js, Бот, БД, Redis) выполните:

1. Подготовьте `.env` файл с продакшен ключами.
2. Соберите и запустите контейнеры:
// turbo
`docker compose -f docker-compose.prod.yml up -d --build`

3. Примените миграции базы данных:
// turbo
`docker exec smmplan-app-prod npx prisma migrate deploy`

4. Проверьте логи для подтверждения успешного запуска:
`docker compose -f docker-compose.prod.yml logs --tail=100 -f`
