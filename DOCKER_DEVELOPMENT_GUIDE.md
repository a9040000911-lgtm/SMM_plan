# SMMplan: Docker Development & Deployment Guide 🐳

This guide outlines the workflow for making changes to the project, verifying them locally in a production-like environment, and deploying them to the server.

---

## 🛠 1. Development & Local Verification

Always test your changes in the local Docker environment before pushing to the server.

### Step 1: Make your changes
Edit the code in VS Code. If you add new dependencies, run `npm install`.

### Step 2: Build the project locally
We use a **Hybrid Build** strategy (Local Build + Docker Copy) to save memory and time.
```powershell
# 1. Build the Next.js application
npm run build

# 2. Synchronize the local Docker images with your new code
$env:BUILDKIT_PROGRESS="plain"; docker compose -f docker-compose.prod.yml build
```

### Step 3: Verify locally
```powershell
# Start the production stack on your computer
docker compose -f docker-compose.prod.yml up -d

# Check the results:
# Website: http://localhost
# Health: http://localhost/api/health
# Logs: docker logs smmplan-app -f
```

---

## 🚀 2. Deployment to Production Server

Once verified locally, follow these steps to update the server.

### Step 1: Export Images to Archives
```powershell
docker save smmplan-app:latest > smmplan-app.tar
docker save smmplan-bot:latest > smmplan-bot.tar
```

### Step 2: Transfer Files to Server
Use FileZilla, WinSCP, or `scp` to copy the following to the server:
- `smmplan-app.tar`
- `smmplan-bot.tar`
- `docker-compose.prod.yml`
- `nginx/` folder (if you changed Nginx config)

### Step 3: Update Server (via SSH)
```bash
# 1. Load the new images into the server's Docker
docker load < smmplan-app.tar
docker load < smmplan-bot.tar

# 2. Restart the containers with the new images
docker compose -f docker-compose.prod.yml up -d
```

---

## ⚠️ Troubleshooting

- **Redis Error**: If you see "IMPORTANT! Eviction policy is allkeys-lru", it's a warning, not a crash. The system will handle it.
- **Bot 401 Error**: This usually means the Telegram token is already active on another machine or is invalid.
- **Port Conflict**: Ensure port 80 and 443 are free on your local machine before running `up -d`.

---
*Last updated: March 13, 2026*
