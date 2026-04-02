# NGINX & Docker Deployment Guide 🚀
*The Ultimate Handbook for Smmplan Soft-Switching and Reverse Proxy Management*

Этот гид является глубоким руководством по боевому развертыванию приложения (Zero-Downtime), управлению Nginx внутри Docker и устранению частых отказов, таких как Ошибка 502.

---

## 🏗️ 1. Техника Развертывания (Sequence Pipeline)

Чтобы развернуть новую версию Smmplan без "обрыва" клиентских подключений, строго соблюдайте алгоритм ниже. Выкат работает не через убийство старого контейнера, а через поэтапный перехват трафика:

1. **Push & Build:** Код отправляется в Github. Github Actions собирает легкий готовый `ghcr` Docker-образ. Production-сервер НЕ собирает код.
2. **Pull (Подготовка):** 
   ```bash
   docker-compose pull app
   ```
   *Скачивает новые слои тихо в фоне. Старый сайт работает.*
3. **Database Guardrail (Защита Схемы):**
   ```bash
   docker-compose run --rm app npx prisma db push --accept-data-loss
   ```
   *Применяет миграции к PostgreSQL до старта веб-сервера. Если этого не сделать, новый App упадет при запуске.*
4. **Soft-Switch (Мягкая замена):**
   ```bash
   docker-compose up -d --no-deps app
   ```
   *Docker убивает старый контейнер и мгновенно поднимает новый (миллисекунды). Nginx продолжает слать запросы.*

---

## 🌐 2. Как работать с Nginx в Docker

В архитектуре Smmplan Nginx выступает как "Швейцар" (Reverse Proxy). Он забирает на себя все HTTPS-сертификаты и защищает внутренний порт Next.js (3000) от прямого доступа.

### Архитектура Томов и Сертификатов
В `docker-compose.yml` (или `docker-compose.prod.yml`) контейнер `nginx` должен делить папки с контейнером `certbot` для автообновления:
```yaml
  smmplan-nginx:
    image: nginx:alpine
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - /etc/letsencrypt:/etc/letsencrypt
      - /var/www/certbot:/var/www/certbot
    ports:
      - "80:80"
      - "443:443"
```

### Перезагрузка Конфигураций Nginx (Без Даунтайма)
Если вы изменили файл `./nginx/conf.d/default.conf` (например, добавили новый поддомен), **НЕ ПЕРЕЗАГРУЖАЙТЕ КОНТЕЙНЕР** (`docker-compose restart nginx`). Это вызовет прерывание скачиваний и разорвет сокеты.
**Правильная команда (Горячая замена):**
```bash
docker exec smmplan-nginx nginx -s reload
```

---

## 🛠️ 3. Каталог Фатальных Ошибок (Troubleshooting)

### Ошибка 502 Bad Gateway
**Симптом:** Браузер выдает белую страницу с надписью `502 Bad Gateway`.
**Анатомия ошибки:** Nginx (порты 80/443) жив, но когда он стучится внутрь к контейнеру `app` на порт 3000, ему никто не отвечает.
**Как чинить:**
1. Проверьте статус Next.js: `docker ps`. Если он `Restarting` — он увяз в мертвой петле.
2. Прочитайте хвост логов: `docker logs smmplan_app --tail 50`.
   - Если видите `PrismaClientKnownRequestError` -> Вы забыли сделать миграцию базы данных перед запуском контейнера (см. Шаг 3).
   - Если видите `getaddrinfo EAI_AGAIN smmplan-redis` -> Проблема с сетью Docker. Переменная в `.env` указывает на выключенный контейнер Redis.

### Ошибка 504 Gateway Timeout
**Симптом:** При долгой выгрузке отчета сайт "виснет" на минуту, а потом выдает 504.
**Как чинить:** Добавьте в файл `./nginx/conf.d/default.conf` в блок `location /`:
```nginx
proxy_read_timeout 300s;
proxy_connect_timeout 300s;
```
Сделайте горячую замену: `docker exec smmplan-nginx nginx -s reload`.

### Ошибка "Invalid Grant" / Слетели Cookies в NextAuth
**Симптом:** При попытке авторизоваться через Google или Telegram, вас возвращает на HTTP-версию или пишет ошибку.
**Анатомия ошибки:** Nginx расшифровывает запрос, но не предупреждает Next.js о том, что клиент пришел по HTTPS.
**Как чинить:** Убедитесь, что внутри конфига Nginx проброшен заголовок:
`proxy_set_header X-Forwarded-Proto $scheme;`

### Ошибка `ERR_CERT_AUTHORITY_INVALID` (Сломанный SSL)
**Симптом:** При открытии браузер выдает красный экран "Подключение не защищено".
**Анатомия ошибки:** Nginx пытается использовать просроченные, либо "самоподписанные" (Self-Signed) сертификаты (часто возникающие как временные заглушки для старта Nginx). 
**Как чинить (Принудительная Генерация Let's Encrypt):**
Если Nginx работает, но сертификат фейковый, **удалите** поврежденные сертификаты из кэша и принудительно запросите новые:
```bash
# 1. Затираем битые и временные сертификаты
rm -rf ./nginx/certbot/conf/live/smmplan.pro
rm -rf ./nginx/certbot/conf/archive/smmplan.pro

# 2. Форсируем выдачу боевых ключей через HTTP-01 Webroot:
docker run --rm -v $(pwd)/nginx/certbot/conf:/etc/letsencrypt -v $(pwd)/nginx/certbot/www:/var/www/certbot certbot/certbot certonly --webroot --webroot-path /var/www/certbot --email hello@smmplan.pro --agree-tos --no-eff-email -d smmplan.pro -d www.smmplan.pro --force-renewal --cert-name smmplan.pro --non-interactive

# 3. Перезапускаем Nginx для активации новых ключей:
docker restart smmplan-nginx
```

### Ошибка `429 Too Many Requests` (Жесткий Rate-Limit)
**Симптом:** Сайт работает быстро, но не пускает дальше загрузочного экрана (или 404), отдавая в ответе `429 Too Many Requests - Please wait a moment before refreshing the page.` абсолютно на все роуты. Nginx тут ни при чем.
**Анатомия ошибки:** Приложение (Next.js) использует `@upstash/ratelimit` для защиты (в `src/services/core/rate-limiter.ts`), которое реализовано по принципу **Fail-Closed**. Если в продакшене (`NODE_ENV=production`) не заданы ключи удаленного Upstash REST API (`UPSTASH_REDIS_REST_URL`), Rate Limiter по соображениям безопасности блокирует 100% трафика, запрещая работу вообще.
**Как чинить:** 
Выпущен патч, заменяющий "Fail-Closed" на локальный "V8 Isolate Memory Fallback", который позволяет приложению работать без ключей Upstash. Если ошибка повторится, проверьте:
1. Переданы ли правильные REST API ключи Upstash в контейнер.
2. Не обнулился ли `memoryFallback` в коде `rate-limiter.ts`.

### Сайт отдает `404 Not Found` (Powered By Express), а статика блокируется CSP
**Симптом:** Nginx пропускает запрос, SSL горит зеленым, но в ответ приходит белая страница сырой 404 ошибки (которую сгенерировал не Next.js), а в консоли хрома - тонны сообщений `Content-Security-Policy: default-src 'none'`.
**Анатомия ошибки:** Критическая проблема архитектуры CI/CD. В репозитории лежат ДВА проекта: Веб-сайт и Webhook-Бот. И оба собираются одним файлом `Dockerfile`. Если в секции `app` в файле `docker-compose.yml` забыть явно написать `target: runner`, Docker по умолчанию соберет САМУЮ ПОСЛЕДНЮЮ стадию из файла (а ей была стадия `bot-runner`). В итоге контейнер сайта запускает Telegram-бота с микросервером Express на порту 3000 вместо Next.js!
**Как чинить (Навсегда):** 
1. **Архитектурный реверс:** Мы перенесли стадию сборки веб-сайта (`runner`) в самый конец `Dockerfile`.
2. **Защита в YAML:** Добавили жесткое правило `target: runner` в базовом файле `docker-compose.yml`.
