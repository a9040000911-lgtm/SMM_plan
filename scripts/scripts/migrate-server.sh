#!/bin/bash

# Smmplan Linux Migration & Deployment Script
# Usage: ./migrate-server.sh [--skip-build]

set -e

# Load environment variables if .env exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Fallback for NEXT_PUBLIC_URL
PUBLIC_URL=${NEXT_PUBLIC_URL:-"https://smmplan.ru"}

echo "🚀 Starting Smmplan Migration/Deployment..."

# 1. Pull latest changes (optional, depends on setup)
# git pull origin main

# 2. Build or Load Images
if [[ "$1" == "--skip-build" ]]; then
    echo "📦 Skipping build, attempting to load from .tar if available..."
    if [ -f smmplan-app.tar ]; then docker load -i smmplan-app.tar; fi
    if [ -f smmplan-bot.tar ]; then docker load -i smmplan-bot.tar; fi
else
    echo "🛠 Building Docker images with NEXT_PUBLIC_URL=$PUBLIC_URL..."
    export BUILDKIT_PROGRESS=plain
    docker compose -f docker-compose.prod.yml build --build-arg NEXT_PUBLIC_URL="$PUBLIC_URL"
fi

# 3. Запуск контейнеров
echo "🚀 Запускаем контейнеры (чистый перезапуск для обновления IP и стилей)..."
docker compose -f docker-compose.prod.yml down --remove-orphans

echo "🧹 Clearing stale static volumes..."
# Удаляем именованные тома, чтобы новые стили из билда не перекрывались старыми данными
docker volume rm smmplan_next_static smmplan_next_public || true

if [ "$(grep "TELEGRAM_BOT_TOKEN=\"skip\"" .env)" ]; then
    echo "⏸️ Запуск БЕЗ бота (только сайт и база)..."
    docker compose -f docker-compose.prod.yml up -d nginx app db redis
else
    docker compose -f docker-compose.prod.yml up -d
fi

# 4. Wait for database to be ready
echo "⏳ Waiting for database (smmplan-db) to be healthy..."
until [ "$(docker inspect -f {{.State.Health.Status}} smmplan-db)" == "healthy" ]; do
    sleep 2
done

# 5. Initialize Database Schema
echo "🗄 pushing prisma schema..."
docker exec -u root smmplan-app npx prisma@5.22.0 db push --accept-data-loss --skip-generate

# 6. Run Post-Deployment Patches/Seeds
# (Патч теперь делается на этапе сборки образа, здесь проверяем только БД)
echo "✅ Контейнеры запущены и база синхронизирована."

echo "✅ Deployment Successful!"
echo "📡 App is running at $PUBLIC_URL"
docker compose -f docker-compose.prod.yml ps
