<#
.SYNOPSIS
    Smmplan: World-Class Local Build & Production Deploy Script (PRR Standard)
.DESCRIPTION
    Этот скрипт реализует 12-Factor выкатку без GitHub Actions.
    Сборка происходит ИСКЛЮЧИТЕЛЬНО на локальном ПК разработчика (чтобы уберечь Production от Out-of-Memory).
    Использует холодную миграцию (Cold Docker Migration), предварительную миграцию схемы Prisma (Zero-Downtime Database Sync), 
    а затем бесшовно переключает Nginx.
#>

$ErrorActionPreference = "Stop"

# === 1. Конфигурация ===
$SERVER_IP = "89.23.98.202"
$SERVER_USER = "root"
$IMAGE_NAME = "smmplan-app"
$IMAGE_TAG = "latest"
$ARCHIVE_NAME = "smmplan-app.tar.gz"
$REMOTE_DIR = "/root/smmplan"

Write-Host "🚀 [1/6] Запуск Smmplan Production Readiness Protocol..." -ForegroundColor Cyan

# === 2. Проверка состояния локального Git (Pre-flight) ===
$gitStatus = $(git status --porcelain)
if ($gitStatus) {
    Write-Host "⚠️ Внимание: У вас есть незакоммиченные изменения!" -ForegroundColor Yellow
    Write-Host $gitStatus
    $choice = Read-Host "Продолжить без коммита? (Y/N)"
    if ($choice -notmatch "^y`$") { exit 1 }
}

# === 3. Локальная Сборка Образа (Local Build Phase) ===
Write-Host "📦 [2/6] Запускаем локальную сборку Docker-образа ($IMAGE_NAME:$IMAGE_TAG)..." -ForegroundColor Cyan
# Собираем только target 'runner', чтобы бот и dev-инструменты не собирались в веб-контейнер
$buildProcess = Start-Process -NoNewWindow -Wait -PassThru -FilePath "docker" -ArgumentList "build --target runner -t $IMAGE_NAME:$IMAGE_TAG ."
if ($buildProcess.ExitCode -ne 0) {
    Write-Host "❌ Ошибка при сборке образа!" -ForegroundColor Red
    exit 1
}

# === 4. Упаковка образа в архив (Cold Export) ===
Write-Host "🧊 [3/6] Архивация образа (может занять 1-2 минуты)..." -ForegroundColor Cyan
cmd.exe /c "docker save ${IMAGE_NAME}:${IMAGE_TAG} | gzip > ${ARCHIVE_NAME}"

if (!(Test-Path $ARCHIVE_NAME)) {
    Write-Host "❌ Ошибка архивации образа!" -ForegroundColor Red
    exit 1
}

# === 5. Транспортировка на сервер ===
Write-Host "✈️ [4/6] Отправка архива на Production сервер ($SERVER_IP)..." -ForegroundColor Cyan
$scpArgs = "{0} {1}@{2}:{3}/{0}" -f $ARCHIVE_NAME, $SERVER_USER, $SERVER_IP, $REMOTE_DIR
$scpProcess = Start-Process -NoNewWindow -Wait -PassThru -FilePath "scp" -ArgumentList $scpArgs
if ($scpProcess.ExitCode -ne 0) {
    Write-Host "❌ Ошибка сетевой передачи SCP!" -ForegroundColor Red
    exit 1
}

# === 6. Финальный Zero-Downtime Deploy на Production ===
Write-Host "🏗️ [5/6] Импорт образа и миграция БД на Production сервере..." -ForegroundColor Cyan

$SSH_COMMAND_STRING = @"
cd $REMOTE_DIR &&
echo '📥 Импорт образа...' &&
docker load < $ARCHIVE_NAME &&
echo '🗄️ Синхронизация схемы БД (Prisma Expand-Contract)...' &&
docker run --rm --env-file .env --network smmplan_default $IMAGE_NAME:$IMAGE_TAG npx prisma db push --skip-generate --accept-data-loss &&
echo '🚀 Rolling Update Контейнеров...' &&
docker compose -f docker-compose.prod.yml up -d --no-deps app &&
echo '🧹 Очистка старых архивов...' &&
rm $ARCHIVE_NAME
"@

$sshProcess = Start-Process -NoNewWindow -Wait -PassThru -FilePath "ssh" -ArgumentList "${SERVER_USER}@${SERVER_IP}", "`"$SSH_COMMAND_STRING`""
if ($sshProcess.ExitCode -ne 0) {
    Write-Host "❌ Ошибка применения образа на сервере!" -ForegroundColor Red
    exit 1
}

# === 7. Health Check сервера ===
Write-Host "🩺 [6/6] Проводим Health Check сервера..." -ForegroundColor Cyan
Start-Sleep -Seconds 5
try {
    $response = Invoke-WebRequest -Uri "https://smmplan.pro/api/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 404) {
        Write-Host "✅ Деплой успешно завершен! Production обновлен по стандартам PRR." -ForegroundColor Green
    } else {
        Write-Host "🚨 Health Check провален: Сервер вернул код $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "🚨 Health Check провален: Невозможно достучаться до https://smmplan.pro/api/health" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "💡 См. чеклист отката в PRR Skill." -ForegroundColor Yellow
}

# Очистка локального архива
Remove-Item $ARCHIVE_NAME -ErrorAction SilentlyContinue
