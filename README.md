# 🍶 sool
## 전통주 데이터 기반 분석 & 추천 시스템 (MVP → v1 전환중)

전통주 데이터를 구조화하고  
**검색 · 조회 · 분석(그래프)까지 가능한 데이터 중심 서비스**로 구현한 프로젝트입니다.

> 🍶 Data before recommendation.  
> Structure first, intelligence later.

---

## 프로젝트 개요
- 전통주 정형 데이터 모델링 (sool / sense / user 기반)
- DB → API → Frontend 엔드투엔드 파이프라인 구축
- 분석 기반 추천 시스템으로 확장 가능한 구조

---

## Docker Setup (추천)

Docker를 사용하여 프로젝트를 즉시 구동할 수 있습니다. (MariaDB 포함)

### 1. 서비스 실행
```bash
docker-compose up -d --build
```

### 2. 초기 데이터 임포트 (Seeding)
DB가 생성된 후, 다음 명령어를 실행하여 전통주 기초 데이터를 로드합니다.
```bash
docker exec -it sool-backend bash -c "PYTHONPATH=. python scripts/import_sool_basic.py"
```

### 3. 접속 정보
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Database**: `localhost:3306` (User: `sool`, Password: `soolpass`)

---

## 기술 스택
- Backend: FastAPI, SQLAlchemy
- Database: MariaDB (Docker 기반)
- Frontend: Next.js, Tailwind CSS
- Data / Analysis: Pandas

---

## 문서
- [주요 기능](docs/FEATURES.md)
- [데이터 분석 결과](docs/ANALYSIS.md)
- [실행 방법](docs/RUN.md)
- [로드맵 & 목적](docs/ROADMAP.md)

---

# 주요 기능

## 전통주 검색
- 이름 / 지역 / 주종 기반 검색
- DB 쿼리 기반 빠른 조회

## 상세 페이지
- 전통주 기본 정보
- 도수, 지역, 제조사 등 정형 데이터 제공
- (옵션) 감각 데이터(sense) 기반 레이더/그래프 표시

## 리뷰 저장 구조
- 사용자 리뷰 저장 가능한 테이블 설계
- 평점 및 취향 데이터 확장 가능

## 데이터 기반 통계
- 도수 평균
- 지역별 분포
- 주종별 개수 통계

---

# 데이터 분석 결과 (MVP)
현재는 **기초 통계 분석 중심의 MVP 단계**입니다.  
데이터 구조 검증 및 분석 파이프라인 구축을 목적으로 합니다.

## 전통주 도수 분포
![ABV Distribution](images/abv_distribution.png)

## 지역별 전통주 분포
![Region Distribution](images/region_distribution.png)

## 주종별 전통주 비율
![Type Ratio](images/type_ratio.png)

---

# 실행 방법 (Windows 기준: Docker DB/Backend + Front 로컬)

## 0) 준비물
- Docker Desktop (WSL2 권장)
- Node.js **>= 20.9.0** (Next.js 16 요구사항)
- Git

---

## 1) DB + Backend 실행 (Docker)
프로젝트 루트에서:

본 프로젝트는  
**데이터 분석가 / 백엔드 포지션 지원을 위한 포트폴리오**로,

- 데이터 모델링
- API 설계
- 분석 파이프라인 구축
- 서비스 구조 설계

역량을 **실제 구현 결과물**로 증명하는 것을 목표로 합니다.


  실행 방법

  프로젝트 루트 디렉토리에서 아래 명령어를 순서대로 실행하세요.


   1. 서비스 실행:
   1     docker-compose up -d --build

   2. 초기 데이터 로드 (Seeding):
   1     docker exec -it sool-backend bash -c "PYTHONPATH=. python scripts/import_sool_basic.py"
   3. 접속:
       * Frontend: http://localhost:3000 (http://localhost:3000)
       * Backend API: http://localhost:8000 (http://localhost:8000)
