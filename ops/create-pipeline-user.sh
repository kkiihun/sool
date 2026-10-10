#!/usr/bin/env bash
# 데이터 파이프라인 전용 DB 계정 생성/갱신 (서비스 테이블 SELECT 만). 여러 번 실행해도 안전.
#   사용: ./ops/create-pipeline-user.sh     (.env 의 PIPELINE_DB_PASSWORD 사용)
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env; set +a
: "${PIPELINE_DB_PASSWORD:?.env 에 PIPELINE_DB_PASSWORD 를 넣으세요}"
DB="${DB_NAME:-sool}"

docker exec -i sool-mariadb mariadb -uroot -p"$MYSQL_ROOT_PASSWORD" <<SQL
CREATE USER IF NOT EXISTS 'sool_pipeline'@'%' IDENTIFIED BY '${PIPELINE_DB_PASSWORD}';
ALTER USER 'sool_pipeline'@'%' IDENTIFIED BY '${PIPELINE_DB_PASSWORD}';
GRANT SELECT ON \`${DB}\`.* TO 'sool_pipeline'@'%';
FLUSH PRIVILEGES;
SQL
echo "✅ sool_pipeline 계정 준비 (SELECT on ${DB}.*)"
