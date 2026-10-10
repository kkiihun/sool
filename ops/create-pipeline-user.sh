#!/usr/bin/env bash
# 데이터 파이프라인 전용 DB 계정 생성/갱신. 여러 번 실행해도 안전.
#   서비스 테이블: SELECT 만 / 결과 테이블(analytics_sool_profile, pipeline_run, analytics_place, analytics_purchase): SELECT·INSERT·DELETE
#   결과 테이블은 백엔드가 기동하며 만든다 → 백엔드 배포 후에 실행
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
GRANT SELECT, INSERT, DELETE ON \`${DB}\`.analytics_sool_profile TO 'sool_pipeline'@'%';
GRANT SELECT, INSERT, DELETE ON \`${DB}\`.pipeline_run TO 'sool_pipeline'@'%';
GRANT SELECT, INSERT, DELETE ON \`${DB}\`.analytics_place TO 'sool_pipeline'@'%';
GRANT SELECT, INSERT, DELETE ON \`${DB}\`.analytics_purchase TO 'sool_pipeline'@'%';
FLUSH PRIVILEGES;
SQL
echo "✅ sool_pipeline 계정 준비 (SELECT on ${DB}.*, 쓰기: analytics_sool_profile, pipeline_run, analytics_place, analytics_purchase)"
