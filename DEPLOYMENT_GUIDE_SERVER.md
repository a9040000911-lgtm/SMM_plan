# Инструкция по деплою Smmplan на сервер

Данный архив содержит все необходимые файлы для запуска проекта в продакшн-окружении с использованием Docker.

## 1. Требования
- Чистый сервер (Ubuntu 22.04+ рекомендуется)
- Установленный Docker и Docker Compose (v2+)
- Доменное имя (настроенное на IP сервера)

## 2. Подготовка
1. Скопируйте файлы из этого архива на сервер в директорию проекта (например, `/var/www/smmplan`).
2. Создайте файл `.env` на основе примера:
   ```bash
   cp .env.example .env
   ```
3. Отредактируйте `.env`, вставив актуальные данные:
   - `TELEGRAM_BOT_TOKEN`, `BOT_USERNAME`, `ADMIN_TG_ID`
   - `NEXT_PUBLIC_URL`, `WEBAPP_URL`, `NEXTAUTH_URL` (укажите ваш реальный домен)
   - `NEXTAUTH_SECRET` (желательно сгенерировать новый: `openssl rand -base64 32`)
   - `ADMIN_MASTER_KEY` (секретный код для входа в админку)
   - API ключи провайдеров

## 3. Запуск (Для серверов с низкой RAM)
Если вы используете **готовые образы** (`.tar`), выполните их загрузку вместо сборки:

1. Загрузите образы в Docker:
   ```bash
   docker load -i smmplan-app.tar
   docker load -i smmplan-bot.tar
   ```

2. Запустите проект (без флага `--build`):
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

Это позволит избежать тяжелой компиляции проекта на самом сервере, экономя оперативную память.

## 4. Инициализация базы данных
После первого запуска необходимо накатить схему базы данных:
```bash
docker exec -it smmplan-app npx prisma db push
```

## 5. Настройка SSL (HTTPS)
Конфигурация Nginx находится в `nginx/nginx.conf`. Она подготовлена для работы по HTTP. 
Для включения HTTPS рекомендуется использовать **Certbot**:
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d smmplan.ru
```

## 6. Полезные команды
- **Логи приложения**: `docker logs -f smmplan-app`
- **Логи бота**: `docker logs -f smmplan-bot`
- **Перезапуск**: `docker compose restart`

---
© 2024-2026 Smmplan. Автор: Artem.
