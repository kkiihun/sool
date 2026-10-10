# sool (술): Traditional Spirits Data Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs)](https://nextjs.org/)
[![MariaDB](https://img.shields.io/badge/MariaDB-003545?style=flat&logo=mariadb)](https://mariadb.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)

sool은 한국 전통주의 데이터를 체계화하고 시각화하여, 소비자에게는 개인화된 취향 발견을, 양조장에게는 데이터 기반의 시장 인사이트를 제공하는 플랫폼입니다.

---

## 🌟 Key Features

### 1. 소비자 (B2C) - 취향 발견과 기록
- 테이스팅 노트 (Tasting Notes): 향, 단맛, 산미, 바디감 등을 정밀하게 기록하고 관리.
- 맛 지표 시각화 (Flavor Radar): 레이더 차트를 통해 복잡한 전통주의 풍미를 한눈에 파악.
- 취향 기반 추천: 코사인 유사도(Cosine Similarity) 알고리즘을 활용한 맞춤형 전통주 추천.

### 2. 양조장 (B2B) - 데이터 기반 의사결정
- 제품 분석 리포트: 전체 시장 데이터 대비 자사 제품의 위치를 백분위로 분석.
- 시장 트렌드 대시보드: 카테고리별, 지역별 전통주 분포 및 선호도 데이터 제공.

---

## 🛠 Tech Stack

### Backend
- Framework: FastAPI (Python 3.11+)
- ORM: SQLAlchemy 2.0
- Database: MariaDB 10.11
- Data Analysis: Pandas, Matplotlib, Seaborn
- Security: JWT (python-jose), Passlib (bcrypt)

### Frontend
- Framework: Next.js 16 (App Router)
- UI Library: Ant Design (v6)
- Visualization: Recharts, Chart.js
- Styling: Tailwind CSS, CSS Modules

### DevOps & Infrastructure
- Containerization: Docker, Docker Compose
- Environment: Windows/Linux Support

---

## 📁 Repository Layout

```text
.
├── backend/            # FastAPI app, models, migrations, data loaders
│   ├── app/            # Core application logic (API, Models, Schemas)
│   ├── data/           # Raw CSV datasets (sool_basic, sense)
│   └── scripts/        # DB sync, data migration & loading scripts
├── frontend/           # Next.js app
│   ├── app/            # App Router pages and components
│   └── components/     # Reusable UI components
├── data/               # Shared project data and datasets
├── docs/               # Project documentation and analysis
│   └── analysis/       # Service target & market analysis
├── exports/            # Generated reports (PDF/CSV) and dumps
├── scripts/            # Root-level utility scripts
└── docker-compose.yml  # 운영용 compose (개발은 docker-compose.dev.yml 덮어쓰기)
```

---

# 실행 방법

구조: 브라우저 → **frontend(:3300)** → `/api/proxy/*` → backend(:8000, 내부망) → MariaDB(내부망)
인증은 HttpOnly 쿠키(`access_token`) 하나로 통일되어 있고, 외부에 열리는 포트는 프론트 하나뿐입니다.

## 0) 환경변수
```bash
cp .env.example .env
# DB_PASSWORD / MYSQL_ROOT_PASSWORD / SECRET_KEY 값 변경 (SECRET_KEY: openssl rand -hex 32)
```

## 1) 운영 (리눅스 서버)
```bash
docker compose up -d --build        # 또는 ./ops/deploy.sh main
```
- 접속: `http://<서버IP>:3300`
- 최초 1회 데이터 적재: `docker exec -it sool-backend bash -c "PYTHONPATH=. python scripts/import_sool_basic.py"`
  (기존 DB를 옮길 땐 `./ops/backup.sh` → 파일 복사 → `./ops/restore.sh <파일>`)
- 백업: `./ops/backup.sh` (crontab 예시는 스크립트 상단 참고)

## 2) 개발 (맥: 소스 마운트 + 핫리로드)
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```
- Frontend: http://localhost:3300
- Backend API 문서: http://localhost:8000/docs (DB: localhost:3306)

---

## 🗺️ Development Roadmap

- [ ] Data Consolidation: Legacy API를 TastingNote 구조로 통합 완료.
- [ ] Recommendation Engine: 활동 로그 기반 하이브리드 추천 모델 도입.
- [ ] B2B Dashboard: 양조장 관리자를 위한 실시간 분석 대시보드 구현.
- [ ] UX Enhancement: 테이스팅 노트 작성 프로세스 인터랙티브 UI 강화.

---

## 📄 Documentation
- [서비스 타겟 분석 보고서](docs/analysis/service_target_analysis.md)
- [데이터 마이그레이션 가이드](docs/runbooks/migration-from-development-copy.md)

---

본 프로젝트는  
**데이터 분석가 / 백엔드 포지션 지원을 위한 포트폴리오**로,

- 데이터 모델링
- API 설계
- 분석 파이프라인 구축
- 서비스 구조 설계

역량을 **실제 구현 결과물**로 증명하는 것을 목표로 합니다.
