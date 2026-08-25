#!/usr/bin/env bash
# Backup diario de MongoDB Atlas via mongodump dockerizado.
# Cron: 0 4 * * * /home/OBEY-YOUR-MASTER/scripts/mongo-backup.sh >> /var/log/mongo-backup.log 2>&1
set -euo pipefail

BACKUP_DIR=/home/backups/mongo
RETENTION_DAYS=7
ENV_FILE=/home/OBEY-YOUR-MASTER/.env

MONGO_URL=$(grep -m1 '^MONGO_URL=' "$ENV_FILE" | cut -d= -f2-)
[ -n "$MONGO_URL" ] || { echo "[$(date -Is)] ERROR: MONGO_URL no encontrado en $ENV_FILE"; exit 1; }

mkdir -p "$BACKUP_DIR"
OUT="obey-$(date +%F).archive.gz"

# --archive a stdout evita problemas de permisos con el volumen
docker run --rm --network host mongo:7 \
  mongodump --uri="$MONGO_URL" --archive --gzip --quiet > "$BACKUP_DIR/$OUT"

# Retención: borrar backups con más de N días
find "$BACKUP_DIR" -name 'obey-*.archive.gz' -mtime +"$RETENTION_DAYS" -delete

echo "[$(date -Is)] OK: $OUT ($(du -h "$BACKUP_DIR/$OUT" | cut -f1))"
