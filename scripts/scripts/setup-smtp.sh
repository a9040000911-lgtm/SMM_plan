#!/bin/bash

# (c) 2024-2026 Smmplan. SMTP Configuration Utility.
# This script applies SMTP settings to the .env file and restarts the app container.

echo "📧 Configuring SMTP for Smmplan..."

# Values provided by user
SMTP_HOST="smtp.yandex.ru"
SMTP_PORT="465"
SMTP_USER="infosokoloff@yandex.ru"
SMTP_PASSWORD="gwcvytnioxcclkon"

# Function to update or add env var
update_env() {
    local key=$1
    local value=$2
    if grep -q "^${key}=" .env; then
        sed -i "s|^${key}=.*|${key}=\"${value}\"|" .env
    else
        echo "${key}=\"${value}\"" >> .env
    fi
}

# Apply settings
update_env "SMTP_HOST" "$SMTP_HOST"
update_env "SMTP_PORT" "$SMTP_PORT"
update_env "SMTP_USER" "$SMTP_USER"
update_env "SMTP_PASSWORD" "$SMTP_PASSWORD"

echo "✅ SMTP settings applied to .env"
echo "♻️ Restarting Smmplan app container..."

docker compose -f docker-compose.prod.yml up -d app

echo "✨ Done! You can now test password reset on the website."
