#!/bin/bash
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

# Smmplan Yandex Disk Sync Script (v1.0)
# Uses rclone to sync local backups to remote cloud storage.

# Check if rclone is installed
if ! command -v rclone &> /dev/null; then
    echo "❌ ERROR: rclone is not installed."
    echo "💡 Install it: 'curl https://rclone.org/install.sh | sudo bash'"
    echo "💡 Configure it: 'rclone config' (create a remote named 'yandex')"
    exit 1
fi

echo "☁️ [$(date)] Starting sync to Yandex Disk..."

# Perform sync
# We use 'copy' to keep files on the cloud even if deleted locally (after 7 days)
rclone copy ./backups yandex:Smmplan/Backups \
    --include "local_smmplan_backup_*.sql" \
    --update \
    --use-mtime \
    --verbose

if [ $? -eq 0 ]; then
    echo "✅ Success! Backups synced to Yandex Disk (remote: yandex:Smmplan/Backups)."
else
    echo "❌ Error: Failed to sync backups to Yandex Disk. Please check rclone config."
    exit 1
fi
