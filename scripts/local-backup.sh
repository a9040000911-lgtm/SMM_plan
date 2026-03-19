#!/bin/bash
# (c) 2026 Smmplan - Local Quick Backup Script

# Create local directory if doesn't exist
mkdir -p ./backups

DATE_STR=$(date +%Y-%m-%d_%H-%M-%S)
FILE_NAME="local_smmplan_backup_$DATE_STR.sql"
FILE_PATH="./backups/$FILE_NAME"

echo "🛡️ [$(date)] Starting local database backup..."

# Check if container is running
if [ ! "$(docker ps -q -f name=smmplan-db)" ]; then
    echo "❌ ERROR: Container 'smmplan-db' is not running!"
    exit 1
fi

# Try to dump from Docker
docker exec smmplan-db pg_dump -U smmuser smmplan > "$FILE_PATH"

if [ $? -eq 0 ]; then
    SIZE=$(ls -lh "$FILE_PATH" | awk '{print $5}')
    echo "✅ Success! Backup saved to: $FILE_PATH ($SIZE)"
    
    # Rotation: Delete backups older than 7 days
    echo "🧹 Cleaning up old backups (7+ days)..."
    find ./backups -name "local_smmplan_backup_*.sql" -mtime +7 -delete
    echo "✅ Success! Old backups removed."
else
    echo "❌ Error: Failed to create database dump."
    rm -f "$FILE_PATH"
    exit 1
fi
