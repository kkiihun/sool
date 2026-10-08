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
- 분석 기반 추천 시스템 확장 가능 구조

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

본 프로젝트는  
**데이터 분석가 / 백엔드 포지션 지원을 위한 포트폴리오**로,

- 데이터 모델링
- API 설계
- 분석 파이프라인 구축
- 서비스 구조 설계

역량을 **실제 구현 결과물**로 증명하는 것을 목표로 합니다.
