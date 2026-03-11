#!/bin/bash

# =============================================================================
# Smmplan — "One-Click" Setup & Deploy Script for Linux (Docker)
# =============================================================================

set -e

echo "🚀 Начинаем полную настройку Smmplan..."

# --- ОПТИМИЗАЦИЯ ПАМЯТИ (Swap) ---
if [ $(free -m | grep Swap | awk '{print $2}') -le 100 ]; then
    echo "⚠️ ВНИМАНИЕ: На сервере мало подкачки (Swap). Сборка может зависнуть."
    read -p "Создать файл подкачки на 2ГБ? (y/n): " CREATE_SWAP
    if [ "$CREATE_SWAP" == "y" ]; then
        echo "🔧 Создаем 2GB Swap..."
        sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile
        echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab
        echo "✅ Swap настроен."
    fi
fi

# 1. Запрос данных у пользователя (если не переданы через ENV)
if [ -z "$SERVER_IP" ]; then
    read -p "Введите IP адрес этого сервера (например, 89.23.98.202): " SERVER_IP
fi

if [ -z "$ENABLE_BOT" ]; then
    read -p "Включить Telegram бота? (y/n): " ENABLE_BOT
fi

if [ "$ENABLE_BOT" == "y" ]; then
    if [ -z "$TG_TOKEN" ]; then read -p "Введите Telegram Bot Token: " TG_TOKEN; fi
    if [ -z "$TG_USER" ]; then read -p "Введите Telegram Bot Username (без @): " TG_USER; fi
    if [ -z "$TG_ADMIN_ID" ]; then read -p "Введите Ваш Telegram ID (цифрами): " TG_ADMIN_ID; fi
else
    echo "⏸️ Бот будет отключен (его можно включить позже в .env)"
    TG_TOKEN="skip"
    TG_USER="skip"
    TG_ADMIN_ID="0"
fi

if [ -z "$ADMIN_PASS" ]; then
    read -p "Введите пароль для админки (ADMIN_MASTER_KEY): " ADMIN_PASS
fi

# Генерация случайного секрета
AUTH_SECRET=$(openssl rand -base64 32 | tr -d /=+ | cut -c1-32)

echo "📝 Создаем файл .env..."

cat <<EOF > .env
# --- БАЗА ДАННЫХ ---
DATABASE_URL="postgresql://smmuser:smmpassword@db:5432/smmplan?schema=public"

# --- СЕТЬ (IP: $SERVER_IP) ---
NEXT_PUBLIC_URL="http://$SERVER_IP"
WEBAPP_URL="http://$SERVER_IP"
NEXT_PUBLIC_APP_URL="http://$SERVER_IP"
NEXTAUTH_URL="http://$SERVER_IP"
SERVER_IP="$SERVER_IP"

# --- ТЕЛЕГРАМ ---
TELEGRAM_BOT_TOKEN="$TG_TOKEN"
BOT_USERNAME="$TG_USER"
ADMIN_TG_ID="$TG_ADMIN_ID"

# --- БЕЗОПАСНОСТЬ ---
NEXTAUTH_SECRET="$AUTH_SECRET"
ADMIN_MASTER_KEY="$ADMIN_PASS"

# --- СИСТЕМНЫЕ ---
NODE_ENV="production"
PORT=3000
PRISMA_CLIENT_ENGINE_TYPE="library"
EOF

echo "✅ Файл .env создан успешно."

# 2. Исправление прав доступа
chmod +x scripts/migrate-server.sh

# 3. Запуск основного процесса сборки и миграции
echo "🛠 Начинаем сборку и запуск Docker (это может занять 5-10 минут)..."

./scripts/migrate-server.sh

echo ""
echo "===================================================================="
echo "🎉 ГИГАНТСКИЙ УСПЕХ! Проект Smmplan развернут."
echo "🔗 Адрес сайта: http://$SERVER_IP"
echo "🔗 GitLab: http://$SERVER_IP:8080"
echo "===================================================================="
echo "Совет: Если стили не подгрузились сразу, подождите 30 секунд "
echo "(Nginx нужно время, чтобы проиндексировать тома после сборки)."
