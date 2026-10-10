# sool 프로젝트 구동 가이드 (Service Run Guide)

이 문서는 프로젝트를 처음 설치하거나 초기화할 때 실행해야 하는 순서를 정리한 가이드입니다.

---

## 1. 환경 준비 (Prerequisites)
- Docker Desktop: 실행 중이어야 합니다.
- .env 파일: 루트 디렉토리에 존재해야 합니다. (DB 비밀번호 및 환경 변수 설정)

---

## 2. 서비스 구동 및 초기화 순서 (Execution Order)

### 단계 1: 컨테이너 빌드 및 실행
모든 컨테이너(MariaDB, Backend, Frontend)를 빌드하고 백그라운드에서 실행합니다.
powershell
docker compose up -d --build


### 단계 2: 데이터베이스 스키마 동기화
데이터베이스 테이블을 생성합니다.
powershell
docker compose exec backend python scripts/sync_db_schema.py


### 단계 3: 기초 데이터 로드 (전통주 정보)
backend/data/sool_basic_clean.csv 파일을 기반으로 전통주 마스터 데이터를 로드합니다.
powershell
docker compose exec backend python scripts/import_sool_basic.py


### 단계 4: 감각 데이터 로드 (맛 지표)
backend/data/sense_clean.csv 파일을 기반으로 각 전통주의 상세 맛 데이터를 로드합니다.
powershell
docker compose exec backend python scripts/load_data.py


---

## 3. 서비스 접속 정보
구동이 완료되면 아래 주소로 접속할 수 있습니다.

- Frontend: [http://localhost:3300](http://localhost:3300) (사용자 인터페이스)
- Backend API: [http://localhost:8000](http://localhost:8000) (API 문서: /docs)
- MariaDB: localhost:3307 (외부 접속용 포트)

---

## 4. 문제 해결 (Troubleshooting)

### Docker Credential 오류 발생 시
만약 error getting credentials와 같은 오류가 발생한다면, Docker Desktop의 로그아웃 후 재로그인을 시도하거나 Docker Desktop 설정에서 'Use Docker Scout' 등을 확인해 보세요.

### 데이터 중복 로드 방지
import_sool_basic.py와 load_data.py는 실행 시 기존 데이터를 덮어쓰거나 중복될 수 있으므로, 초기화 시에만 한 번씩 실행하는 것을 권장합니다.
