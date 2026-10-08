#!/usr/bin/env bash
# DB 백업 (gzip). 기본 14일 보관.
#   수동: ./ops/backup.sh
#   매일 새벽 3시 (crontab -e):  0 3 * * * /home/<user>/sool/ops/backup.sh >> /home/<user>/sool/backups/backup.log 2>&1
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env; set +a

DIR="${BACKUP_DIR:-./backups}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
mkdir -p "$DIR"
FILE="$DIR/sool-$(date +%Y%m%d-%H%M%S).sql.gz"

docker exec sool-mariadb mariadb-dump -uroot -p"$MYSQL_ROOT_PASSWORD" \
  --single-transaction --routines --triggers "${DB_NAME:-sool}" | gzip > "$FILE"

find "$DIR" -name 'sool-*.sql.gz' -mtime +"$KEEP_DAYS" -delete
echo "✅ $(date '+%F %T') 백업: $FILE ($(du -h "$FILE" | cut -f1))"
