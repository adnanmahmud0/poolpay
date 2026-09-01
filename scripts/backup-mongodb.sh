#!/bin/bash
# ==========================================
# Automated MongoDB Daily Backup Script
# ==========================================

BACKUP_DIR="/home/ubuntu/backups/mongodb"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_PATH="$BACKUP_DIR/mongo_backup_$TIMESTAMP"
CONTAINER_NAME="poolpay_mongodb_prod"
DB_NAME="poolPay-db"
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"

echo "📦 Creating MongoDB backup for $DB_NAME..."

# Execute mongodump inside the container
docker exec $CONTAINER_NAME mongodump --db $DB_NAME --out /data/db/backup_temp

# Copy out to host backup directory
docker cp $CONTAINER_NAME:/data/db/backup_temp/$DB_NAME "$BACKUP_PATH"

# Clean up container temp
docker exec $CONTAINER_NAME rm -rf /data/db/backup_temp

# Tar and compress
tar -czf "$BACKUP_PATH.tar.gz" -C "$BACKUP_DIR" "mongo_backup_$TIMESTAMP"
rm -rf "$BACKUP_PATH"

# Remove backups older than retention period
find "$BACKUP_DIR" -type f -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "✅ Backup successfully saved at $BACKUP_PATH.tar.gz"
