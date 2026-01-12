✅ Data Import / Seed (SSOT)

(1) 기본 MVP 적재(권장)

스크립트: backend/scripts/import_sool_basic.py

목적: sool 마스터 데이터 + 기본 화면 동작 확인용

(2) v2 적재(옵션)

스크립트: backend/scripts/import_v2.py

목적: v2 스키마/확장 실험

(3) tasting CSV → MariaDB 적재(주의: 로컬 전용 스크립트)

스크립트: backend/import_csv_to_mariadb.py

현재 스크립트 제약(중요):

CSV 파일명: sense_traditional.csv (스크립트 실행 위치 기준)

DB 접속: host="localhost", user/pass/db 고정

대상 테이블: tasting

SOOL_ID = 1 로 모든 row가 한 술(sool_id=1)에만 연결됨

실행 예시(현재 구현 기준):

cd backend
python3 import_csv_to_mariadb.py


⏳ Verification 상태: 현재 WSL 환경에 docker 미설치로 “compose 기반 재현”은 미검증.
(Docker Desktop + WSL Integration 세팅 후 docker compose 기준으로 RUN.md를 최종 검증 체크 예정)
