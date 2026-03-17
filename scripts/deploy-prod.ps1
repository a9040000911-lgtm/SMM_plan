# Smmplan Local-to-Remote Deployment Script
# Usage: ./scripts/deploy-prod.ps1

$SERVER_IP = "89.23.98.202"
$REMOTE_USER = "root"

Write-Host "Starting Local Build for Smmplan..." -ForegroundColor Cyan

# 1. Build locally
Write-Host "Building Docker images (hybrid architecture)..."
docker compose -f docker-compose.prod.yml build

# 2. Save images to tar
Write-Host "Exporting images to TAR files..."
docker save -o smmplan-app.tar smmplan-app:latest
docker save -o smmplan-bot.tar smmplan-bot:latest

# 3. Transfer to server
Write-Host "Transferring files to $SERVER_IP..."
scp smmplan-app.tar "$($REMOTE_USER)@$($SERVER_IP):/root/"
scp smmplan-bot.tar "$($REMOTE_USER)@$($SERVER_IP):/root/"
scp docker-compose.prod.yml "$($REMOTE_USER)@$($SERVER_IP):/root/"
scp -r nginx "$($REMOTE_USER)@$($SERVER_IP):/root/"

# 4. Remote Import and Restart
Write-Host "Restarting services on server..."
ssh "$($REMOTE_USER)@$($SERVER_IP)" "
    docker load -i /root/smmplan-app.tar && \
    docker load -i /root/smmplan-bot.tar && \
    docker compose -f /root/docker-compose.prod.yml down && \
    docker compose -f /root/docker-compose.prod.yml up -d --scale app=3 && \
    docker system prune -f
"

Write-Host "Deployment Successful!" -ForegroundColor Green
Write-Host "Check status at http://$SERVER_IP"
