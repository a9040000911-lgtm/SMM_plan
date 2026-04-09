# Smmplan Production Deployment Script
# (c) 2026 Artem (http://artmspektr.ru)

$ErrorActionPreference = "Stop"

$SERVER_IP = "89.23.98.202"
$REMOTE_DIR = "/root/smmplan"
$APP_CONTAINER = "smmplan-app"

Write-Host "[DEPLOY] Starting Smmplan Production Deployment..." -ForegroundColor Cyan

# 1. Local Build
Write-Host "[BUILD] Building Next.js application locally..." -ForegroundColor Yellow
# npm run build

# 2. Package App Assets
Write-Host "[PKG] Packaging application assets..." -ForegroundColor Yellow
if (Test-Path "deploy_app.tar.gz") { Remove-Item "deploy_app.tar.gz" }
# We need standalone, static, and public
tar -czf deploy_app.tar.gz .next/standalone .next/static public prisma package.json

# 3. Package Bot Assets
Write-Host "[PKG] Packaging bot assets..." -ForegroundColor Yellow
if (Test-Path "deploy_bot.tar.gz") { Remove-Item "deploy_bot.tar.gz" }
tar -czf deploy_bot.tar.gz src prisma package.json package-lock.json tsconfig.json

# 4. Transfer to Server
Write-Host "[TRANSFER] Transferring archives to server ($SERVER_IP)..." -ForegroundColor Yellow
scp deploy_app.tar.gz deploy_bot.tar.gz docker-compose.prod.yml Dockerfile.hybrid root@${SERVER_IP}:${REMOTE_DIR}/

# 5. Remote Extraction and Restart
Write-Host "[REMOTE] Remote setup and container restart..." -ForegroundColor Yellow
$remoteCommand = @"
    cd $REMOTE_DIR
    echo '--- Extracting App Assets ---'
    tar -xzf deploy_app.tar.gz
    
    echo '--- Extracting Bot Assets ---'
    tar -xzf deploy_bot.tar.gz
    
    echo '--- Restarting Containers ---'
    docker compose -f docker-compose.prod.yml up -d --build
    
    echo '--- Cleanup ---'
    rm deploy_app.tar.gz deploy_bot.tar.gz
"@

$remoteCommand = $remoteCommand.Replace("`r", "")
ssh root@$SERVER_IP $remoteCommand

Write-Host "[SUCCESS] Deployment Complete! Site should be available at http://$SERVER_IP" -ForegroundColor Green
