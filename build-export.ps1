$ErrorActionPreference = "Stop"

Write-Host "🚀 Smmplan Production Build started..." -ForegroundColor Cyan

Write-Host "[1/3] Building Docker image (target: runner)..." -ForegroundColor Yellow
docker build --target runner -t smmplan-app:latest .

Write-Host "[2/3] Exporting Docker image into TAR.GZ archive..." -ForegroundColor Yellow
docker save smmplan-app:latest | gzip > smmplan-app.tar.gz

Write-Host "✅ [3/3] DONE! smmplan-app.tar.gz is ready for SCP upload to the remote server." -ForegroundColor Green
