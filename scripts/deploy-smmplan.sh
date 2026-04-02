#!/bin/bash
set -e

echo "🚀 Начинаем Enterprise Deployment (SMMplan)"

# 1. Загрузка параметров
IMAGE_NAME="ghcr.io/a9040000911-lgtm/smmplan_app"
VERSION=${1:-"latest"}  # По умолчанию latest, но обычно будем передавать vX.Y.Z

echo "📥 Стягиваем новую версию $VERSION..."
docker pull $IMAGE_NAME:$VERSION

# Вычисляем текущую версию приложения
CURRENT=$(docker-compose images | grep app | awk '{print $3}')
if [ -z "$CURRENT" ]; then
    echo "⚠️ Старая версия не найдена. Поднимаем с нуля."
    docker-compose up -d
    exit 0
fi

if [ "$CURRENT" == "$IMAGE_NAME:$VERSION" ]; then
    echo "✅ Версия $VERSION уже запущенна! Деплой не требуется."
    exit 0
fi

# 2. Обновляем docker-compose (sed'ом или через ENV Variable - предпочтительно ENV)
echo "🧬 Подготавливаем docker-compose..."
export APP_IMAGE_VERSION=$VERSION

# 3. Бесшовный Оркестратор (Staggered Rolling Update)
echo "🔄 Запускаем Staggered Reboot (Вместо 502 ошибки nginx)"
# Чтобы избежать простоя, мы перезагружаем контейнеры по очереди, 
# если их Scale > 1 (например 3). Мы можем использовать docker rollout плагин
# или встроенный scale механизм (scale app=4 -> kill 1,kill 2,kill 3 -> scale app=3)

# Т.к. плагина может не быть, используем стандартный Docker --no-deps
# Это атомарно пересоздаст контейнер за 1-2 секунды, Nginx сам сделает Retry на другой узел.
docker-compose up -d --no-deps app

echo "🔍 Проводим Health Check..."
sleep 5
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "500")

if [ "$HTTP_CODE" -ne 200 ]; then
    echo "🚨 Health Check провален! Откатываемся на версию $CURRENT"
    export APP_IMAGE_VERSION=$CURRENT
    docker-compose up -d --no-deps app
    exit 1
fi

echo "✅ Деплой успешно завершен! (V: $VERSION)"
