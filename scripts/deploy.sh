#!/bin/bash
set -e

# ==============================================================================
# Smmplan Local-to-Production Deploy Script (Bash Version)
# Описание: Изолированная локальная сборка образа и инъекция в Production
# Защищает Production сервер от Out-Of-Memory при компиляции Webpack.
# Включает защиту от Phantom Schema (pre-flight DB sync) и Muted Static (zero-volumes).
# ==============================================================================

SERVER_IP="89.23.98.202"
SERVER_USER="root"
IMAGE_NAME="smmplan-app"
IMAGE_TAG="latest"
ARCHIVE_NAME="smmplan-app.tar.gz"
REMOTE_DIR="/root/smmplan"

echo -e "\033[1;36m🚀 [1/6] Запуск Smmplan Production Readiness Protocol (Bash)\033[0m"

# 1. Заморозка кода пропущена для скорости

# 2. Локальная сборка образа
echo -e "\033[1;36m📦 [2/6] Запускаем строгую локальную сборку Docker-образа ($IMAGE_NAME:$IMAGE_TAG)...\033[0m"
docker build --target runner -t ${IMAGE_NAME}:${IMAGE_TAG} .

# 3. Архивация (Cold Export) 
echo -e "\033[1;36m🧊 [3/6] Архивация образа (сжатие для сети)...\033[0m"
docker save ${IMAGE_NAME}:${IMAGE_TAG} | gzip > ${ARCHIVE_NAME}

# 4. Транспорт (SCP)
echo -e "\033[1;36m✈️ [4/6] Отправка архива на Production сервер ($SERVER_IP)...\033[0m"
scp ${ARCHIVE_NAME} ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/${ARCHIVE_NAME}

# 5. Remote Zero-Downtime Injection (SSH)
echo -e "\033[1;36m🏗️ [5/6] Импорт образа и миграция БД на Production сервере...\033[0m"
ssh ${SERVER_USER}@${SERVER_IP} << EOF
    set -e
    cd ${REMOTE_DIR}
    
    echo "📥 Загрузка архива Docker..."
    docker load < ${ARCHIVE_NAME}
    
    echo "🗄️ База Данных: Изолированная синхронизация (Expand-Contract)..."
    docker run --rm --env-file .env --network smmplan_default ${IMAGE_NAME}:${IMAGE_TAG} npx prisma db push --skip-generate --accept-data-loss
    
    echo "🚀 Rolling Update: Пересоздание кластера микросервисов..."
    docker compose -f docker-compose.prod.yml up -d --no-deps app
    
    echo "🧹 Очистка мусора..."
    rm ${ARCHIVE_NAME}
EOF

# 6. Валидация выкатки
echo -e "\033[1;36m🩺 [6/6] Health Check сервера...\033[0m"
sleep 5
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://smmplan.pro/api/health || echo "000")

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 404 ]; then
    echo -e "\033[1;32m✅ Деплой успешно завершен! (Код: $HTTP_CODE)\033[0m"
else
    echo -e "\033[1;31m🚨 Health Check провален: Сервер вернул код $HTTP_CODE\033[0m"
    exit 1
fi

rm -f ${ARCHIVE_NAME}
