#!/bin/bash
# (c) 2026 Smmplan - Local Quick Backup Script

# Create local directory if doesn't exist
mkdir -p ./backups

DATE_STR=$(date +%Y-%m-%d_%H-%M-%S)
FILE_NAME="local_smmplan_backup_$DATE_STR.sql"
FILE_PATH="./backups/$FILE_NAME"

echo "🛡️ Starting local database backup..."

# Try to dump from Docker
docker exec smmplan-db pg_dump -U smmuser smmplan > "$FILE_PATH"

if [ $? -eq 0 ]; then
    SIZE=$(ls -lh "$FILE_PATH" | awk '{print $5}')
    echo "✅ Success! Backup saved to: $FILE_PATH ($SIZE)"
    echo "This file is local and NOT uploaded to Yandex Disk."
else
    echo "❌ Error: Failed to create database dump. Is the container 'smmplan-db' running?"
    exit 1
fi
