#!/usr/bin/env bash
# 백업 파일로 DB 복원 (기존 데이터 덮어씀!)
#   사용: ./ops/restore.sh backups/sool-YYYYMMDD-HHMMSS.sql.gz
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env; set +a

FILE="${1:?백업 파일 경로를 지정하세요}"
read -r -p "⚠️  '${DB_NAME:-sool}' DB를 $FILE 로 덮어씁니다. 계속할까요? [y/N] " ans
[ "$ans" = "y" ] || exit 1

gunzip -c "$FILE" | docker exec -i sool-mariadb mariadb -uroot -p"$MYSQL_ROOT_PASSWORD" "${DB_NAME:-sool}"
echo "✅ 복원 완료"
