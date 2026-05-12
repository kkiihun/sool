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

text
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
└── docker-compose.yml  # Local Docker stack configuration


---

## 🚀 Quick Start (with Docker)

가장 빠르고 안정적으로 개발 환경을 구축하는 방법입니다.

powershell
# 1. 저장소 복제 후 이동
cd D:\sool

# 2. 컨테이너 빌드 및 실행
docker compose up -d --build


- Frontend: http://localhost:3300
- Backend: http://localhost:8000
- MariaDB: localhost:3307 (External Port)

---

## 🗄️ Database Initialization

컨테이너 실행 후 아래 명령어를 통해 데이터베이스 스키마를 동기화하고 기초 데이터를 로드합니다.

powershell
# 1. DB 스키마 동기화
docker compose exec backend python scripts/sync_db_schema.py

# 2. 전통주 기초 데이터 로드 (sool_basic_clean.csv)
docker compose exec backend python scripts/import_sool_basic.py

# 3. 감각(Sense) 데이터 로드 (sense_clean.csv)
docker compose exec backend python scripts/load_data.py


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
