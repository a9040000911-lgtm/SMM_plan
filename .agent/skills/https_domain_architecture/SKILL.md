---
name: https_domain_architecture
description: Индустриальный протокол маршрутизации Nginx, обхода Cloudflare ограничений (DNS-01), проброса NextAuth заголовков и настройки HTTPS сервера без простоя.
---

# 🌐 HTTPS Domain Infrastructure (Nginx Next.js Proxy)

> [!IMPORTANT]
> Настоятельно рекомендуется перед началом работы ознакомиться с полным **[Гайдом по NGINX и Docker Развертыванию](../../NGINX_DOCKER_DEPLOYMENT_GUIDE.md)**. В нем расписана строгая последовательность команд (Sequence), горячие замены конфигов `nginx -s reload` и классификация ошибок 502/504.

Этот навык регулирует правила проксирования трафика от внешнего интернета (HTTPS) к внутренним Docker-контейнерам (HTTP), с учётом тонкостей Cloudflare и Node.js.

## 1. Защита Авторизации (OAuth Reverse Proxy Rule)
Если вы запускаете Next.js (или любой Node-фреймворк) за Nginx, Node.js всегда считает, что работает по HTTP, потому что Nginx "снимает" SSL сертификаты (SSL Termination).
Это приводит к **"Invalid Grant"** ошибке авторизации, так как Google/Telegram Redirect URLs создаются по протоколу `http://`.

**Регламент Nginx:** Блок `location /` ОБЯЗАН содержать заголовки:
```nginx
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header Host $http_host;
```
Переменная `.env` `NEXTAUTH_URL` должна быть строго установлена в `https://вашдомен.com`.

## 2. Поддержка WebSocket (Fast Refresh)
Соединения для real-time чатов и HMR (Hot Module Replacement) будут обрываться Nginx'ом через 60 секунд.
**Регламент Nginx:** Необходимо добавить Upgrade заголовки.
```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_read_timeout 86400;
```

## 3. Генерация Сертификатов (Cloudflare DNS-01 Protocol)
Категорически запрещено использовать `HTTP-01` Webroot Challenge, если используется "Оранжевое Облако" Cloudflare (Строгий режим). Это вызывает зацикливание и ошибку `525 SSL Handshake Failed`.

**Регламент Сертификации:**
1. Использовать `certbot/dns-cloudflare` Docker Image.
2. Подмонтировать API ключ Cloudflare (файл `cloudflare.ini`).
3. Запустить команду:
```bash
certbot certonly --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  -d example.com -d *.example.com # Позволяет получить сверх-ценный Wildcard
```

## 4. Обновление без Перезапуска
Сертификаты живут 90 дней.
Крон-задача выполняет проверку `certbot renew`. После скачивания свежих сертификатов, старый Nginx должен их перечитать **БЕЗ ОСТАНОВКИ**:
Команда: `docker exec smmplan-nginx nginx -s reload`

## 5. Полная Энциклопедия Ошибок Nginx (Troubleshooting Guide)
Глубокое исследование выявило ряд критических узких мест (Edge Cases) NGINX в высоконагруженных Node.js приложениях.

| Код Ошибки | Архитектурная Причина | Промышленное Решение (Nginx.conf) |
| :--- | :--- | :--- |
| **502 Bad Gateway** | `smmplan_app` упал, либо Nginx не может разрешить DNS-адрес (имя контейнера). Если Next.js "холодно" стартует слишком долго, socket отбивается. | В блоке `upstream` используйте `keepalive 32;`. Увеличьте `proxy_connect_timeout 10s;`. |
| **504 Gateway Timeout** | API-запрос (например, генерация отчета Next.js) длится дольше 60 секунд. | Добавить `proxy_read_timeout 300;` и `proxy_send_timeout 300;` в location длинных эндпоинтов. |
| **413 Request Entity Too Large** | Пользователь загружает тяжелоое Файлы (Фотографии в поддержку), а дефолтный лимит Nginx = 1 MB. | В блоке `server {}` прописать `client_max_body_size 50M;`. |
| **File Descriptor Exhaustion (Worker Connections)** | Nginx захлебывается при атаке или пике трафика из-за лимита операционной системы на открытые файлы. | Увеличить `worker_connections 4096;` в блоке `events`. Настроить `worker_rlimit_nofile 8192;` на уровне `main`. |
| **Холодное блокирование (Buffering Disable)** | При отключении `proxy_buffering off;` для обычных страниц, каждый медленный клиент (3G-интернет) физически блокирует поток Next.js. | **Строгое Правило:** `proxy_buffering` всегда должен быть `on` для SSR/SSG. Nginx быстро скачивает ответ у Next.js, отпуская его поток, и сам медленно отдает его 3G клиенту. |

## Чек-лист Деплоя Первого Домена:
- [ ] Проверить A-Запись у регистратора (направить на IP сервера).
- [ ] Сгенерировать сертификаты в `/etc/letsencrypt/` через DNS Challenge.
- [ ] Открыть 443 порт в Nginx, прописать сертификаты.
- [ ] Настроить редирект 80 -> 443.
- [ ] Увеличить `client_max_body_size` для загрузки изображений.
- [ ] Перезагрузить Nginx конфигурацию.
